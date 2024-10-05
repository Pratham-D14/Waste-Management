'use client'

// Suggested code may be subject to a license. Learn more: ~LicenseLog:3537798345.
import { useState, useEffect } from "react"
import Link from 'next/link'
import  { usePathname } from 'next/navigation'
import {Button} from './ui/button'
import {Menu, Coins, Leaf, Search, Bell, User, ChevronDown, LogIn, LogOut} from 'lucide-react'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "./ui/dropdown-menu"
import {Badge} from './ui/badge'

import { createUser, getUnreadNotifications, getUserBalance, getUserByEmail, markNotificationAsRead } from '../utils/database/action';

import {Web3Auth} from '@web3auth/modal'

import { CHAIN_NAMESPACES, IProvider, WEB3AUTH_NETWORK } from "@web3auth/base"
import { EthereumPrivateKeyProvider } from "@web3auth/ethereum-provider"
// import { useMediaQuery } from ''

const clientId = process.env.WEB3_AUTH_CLIENT_ID || "BKTMhEpJzzo4iRAhB9GTIsu7PBxcs_pWWLpdRLbgt3TEUu9QNIwbA4iT9sCO8plhuJbnfIEmdZAQEjKYqiXt0-I"

const chainConfig = {
    chainNameSpace: CHAIN_NAMESPACES.EIP155,
    chainId: "0xaa36a7",
    rpcTarget: "https://rpc.ankr.com/eth_sepolia",
    displayName: "Sepolia Testnet",
    blockExplorerUrl: "https://sepolia.etherscan.io",
    ticker: "ETH",
    TickerName: 'Ethereum',
    logo: "https://assets.web3auth.io/evm-chains/sepolia.png"
}

const privateKeyProvider = new EthereumPrivateKeyProvider({
    config: {chainConfig}
})

const web3Auth = new Web3Auth({
    clientId,
    web3AuthNetwork: WEB3AUTH_NETWORK.TESTNET,
    privateKeyProvider
})

interface HeaderProps {
    onMenuClick: () => void;
    totalEarnings: number;
}

export default function Header({onMenuClick, totalEarnings}: HeaderProps) {
    const [provider, setProvider] = useState<IProvider | null>(null)
    const [isLoggedIn, setIsLoggedIn] = useState(false)
    const [loading, setLoading] = useState(true)
    const [userInfo, setUserInfo] = useState<any>(null)
    const pathname = usePathname();
    const [notification, setNotification] = useState<Notification[]>([])
    const [balace, setBalance] = useState(0)  

    
    // useEffect for Login Users 
    useEffect(()=> {
        const init = async () => {
            try {
                await web3Auth.initModal()
                setProvider(web3Auth.provider)
                if(web3Auth.connected) {
                    setIsLoggedIn(true)
                    const user = await web3Auth.getUserInfo();
                    setUserInfo(user);

                    if(user.email) {
                        localStorage.setItem('userEmail', user.email)
                        try{ 
                            await createUser(user.email, user.name || 'anonymousUser')
                        } catch(error) {
                            console.log('Error Creating User',error)
                        }
                    }
                }
            }catch(error) {
                console.log('Error Initializing Web3Auth', error);
            }finally {
                setLoading(false)
            }
        }
        init()
    }, []);

    // useEffect for fetching notification
    useEffect(() => {
        const fetchNotification = async () => {
            if (userInfo && userInfo.email) {
                const user = await getUserByEmail(userInfo.email)
                if(user) {
                    const unreadNotifications = await getUnreadNotifications(user.id);
                    setNotification(unreadNotifications);
                }
            }
            fetchNotification();

            const notificationInterval = setInterval(fetchNotification, 30000);

            return () => clearInterval(notificationInterval);
        }
    }, [userInfo])
    
    // useEffect for fetching Balance
    useEffect(() => {
        const fetchUserBalance = async () => {
            if(userInfo && userInfo.email) {
                const user = await getUserByEmail(userInfo.email);
                if(user) {
                    const userBalance = await getUserBalance(user.id)
                    setBalance(userBalance)
                }
            }
        }

        fetchUserBalance();

        const handleBalanceUpdate = (event: CustomEvent) => {
            setBalance(event.detail)
        }

        window.addEventListener('balanceUpdate', handleBalanceUpdate as EventListener)

        return () => {
            window.removeEventListener('balanceUpdate', handleBalanceUpdate as EventListener)
        }
    }, [userInfo]) 


    // Handle Login Function
    const login = async () => {
        if(!web3Auth) {
            console.log("Web 3 Auth is not initialized");
            return;
        }
        try {
            const web3authProvider = await web3Auth.connect();
            setProvider(web3authProvider);
            setIsLoggedIn(true);
            const user = await web3Auth.getUserInfo();
            setUserInfo(user);
            
            if(user.email) {
                localStorage.setItem('userEmail', user.email);

                try {
                    await createUser(user.email , user.name || "Anonymous User");
                } catch (error) {
                    console.log("Error while creating user", error);
                }
            }
        } catch (error) {
            console.log("Error Logging In", error);
        }
    }

    // Handle Logout Function 
    const logout = async () => {
        if(!web3Auth) {
            console.log("Web 3 Auth is not initialized");
            return;
        }
        try {
            await web3Auth.logout();
            setProvider(null);
            setIsLoggedIn(false);
            setUserInfo(null);
            localStorage.removeItem('userEmail');
        } catch (error) {
            console.log("Error in loggin out", error)
        }
    }


    // Getting User Info 
    const getUserInfo = async () => {
        if(web3Auth.connected) {
            const user = await web3Auth.getUserInfo();
            setUserInfo(user);

            if(user.email) {
                localStorage.setItem("userEmail", user.email);

                try {
                    await createUser(user.email, user.name || "Anonymous User");
                } catch (error) {
                    console.log("Error while getting userInfo", error)
                }
            }
        }

    }

    // Handle Notification Click
    const handleNotificationClick = async (notificationId: number) => {
        await markNotificationAsRead(notificationId); 
    };

    if(loading) {
        return <div>Loading Web3 Auth.... </div>;
    }

    return (
        <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
            <div className="flex items-center justify-between px-4 py-2">
                <div className="flex items-center"> 
                    <Button variant={"ghost"} size='icon' className="mr-2 md:mr-4" onClick={onMenuClick}>
                        <Menu className="h-6 w-6"/>
                    </Button>
                </div>

            </div>
        </header>
    )
}

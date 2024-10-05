import { db } from './dbConfig';
import { Users, Notifications, Transaction } from "./schema";
import {eq, sql, and, desc} from "drizzle-orm";


//  Creating User
export async function createUser(email: string, name: string) {
    try {
        const [user] = await db.insert(Users).values({email,name}).returning().execute();
        return user;
    }catch(error){
        console.log('Erorr while creating User', error);
        return null;
    }
} 

// Getting Users by Email
export async function getUserByEmail(email: string) {
    try {
        const [user] = await db.select().from(Users).where(eq(Users.email, email)).execute()
        return user;
    } catch (error) {
        console.log("Error Fetcing users by email", error);
        return null;
    }
}

// Getting Unread Notification
export async function getUnreadNotifications(userId: number) {
    try {
        return await db.select().from(Notifications).where(and(eq(Notifications.userId, userId), eq(Notifications.isRead, false))).execute();
    } catch (error) {
        console.log("Error While Getting Unread Notifiication", error);
        return null
    }
}


// Fetching Balance Adding into it 
export async function getUserBalance(userId: number):Promise<number> {
        const transactions =  await getRewardTransaction(userId) as any || [];
        
        if(!transactions) return 0; 
        const balance = transactions.reduce((acc:any, transaction:any) => {
            return transaction.type.startsWith('earned') ? acc + transaction.amount : acc - transaction.amount;
        }, 0)

        return Math.max(balance, 0)
}

// Getting Users Transactions
export async function getRewardTransaction(userId: number) {
    try {
        const transaction = await db.select({
            id:Transaction.id,
            typr: Transaction.type,
            amount: Transaction.amount,
            date: Transaction.date
        }).from(Transaction).where(eq(Transaction.userId, userId)).orderBy(desc(Transaction.date)).limit(10).execute();

        const formattedtransaction = transaction.map(t => ({
            ...t,
            date: t.date.toISOString().split('T')[0] // YYYY-MM-DD
        }))
        return formattedtransaction;
    } catch (error) {
        console.log("Error while fetching reward transaction",error)
    }
}


// Handle Notification Click Marking it as Read
export async function markNotificationAsRead(notificationId: number) {
    try {
        await db.update(Notifications).set({isRead: true}).where(eq(Notifications.id, notificationId)).execute();
    } catch (error) {
        console.log("Error while marking notification as read", error);
    }
}

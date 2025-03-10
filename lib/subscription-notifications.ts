import { db } from '@/lib/firebaseConfig';
import { doc, setDoc, collection, addDoc, Timestamp } from 'firebase/firestore';

/**
 * Types of subscription notifications
 */
export type SubscriptionNotificationType =
  | 'subscription_activated'
  | 'subscription_expired'
  | 'payment_failed'
  | 'renewal_upcoming'
  | 'plan_changed'
  | 'trial_ending';

/**
 * Create a subscription-related notification for a user
 */
export async function createSubscriptionNotification(
  userId: string,
  type: SubscriptionNotificationType,
  details: Record<string, any> = {}
): Promise<void> {
  try {
    // Create the notification object
    const notification = {
      userId,
      type: 'system', // Use system type for the general notification system
      title: getNotificationTitle(type),
      message: getNotificationMessage(type, details),
      status: 'unread',
      createdAt: Timestamp.now(),
      metadata: {
        category: 'account',
        severity: getSeverity(type),
        subscriptionEvent: type,
        ...details
      },
      actionUrl: getActionUrl(type)
    };

    // Add to notifications collection
    await addDoc(collection(db, 'notifications'), notification);
    
    console.log(`Created subscription notification of type '${type}' for user ${userId}`);
  } catch (error) {
    console.error('Error creating subscription notification:', error);
  }
}

/**
 * Get the notification title based on type
 */
function getNotificationTitle(type: SubscriptionNotificationType): string {
  switch (type) {
    case 'subscription_activated':
      return 'Assinatura Premium Ativada';
    case 'subscription_expired':
      return 'Assinatura Premium Expirada';
    case 'payment_failed':
      return 'Falha no Pagamento';
    case 'renewal_upcoming':
      return 'Renovação de Assinatura em Breve';
    case 'plan_changed':
      return 'Plano de Assinatura Alterado';
    case 'trial_ending':
      return 'Período de Teste Acabando';
    default:
      return 'Atualização de Assinatura';
  }
}

/**
 * Get the notification message based on type and details
 */
function getNotificationMessage(
  type: SubscriptionNotificationType,
  details: Record<string, any> = {}
): string {
  switch (type) {
    case 'subscription_activated':
      return 'Sua assinatura Premium foi ativada com sucesso! Você agora tem acesso a todos os recursos premium.';
    
    case 'subscription_expired':
      return 'Sua assinatura Premium expirou. Alguns recursos não estarão mais disponíveis. Renove para continuar aproveitando todos os benefícios.';
    
    case 'payment_failed':
      const attemptCount = details.attemptCount || 1;
      return `Houve um problema com o pagamento da sua assinatura Premium. ${
        attemptCount > 1 
          ? `Esta é a ${attemptCount}ª tentativa de cobrança.` 
          : ''
      } Por favor, verifique seu método de pagamento.`;
    
    case 'renewal_upcoming':
      const daysRemaining = details.daysRemaining || 3;
      return `Sua assinatura Premium será renovada automaticamente em ${daysRemaining} dias. Verifique se seu método de pagamento está atualizado.`;
    
    case 'plan_changed':
      const planName = details.planName || 'Premium';
      return `Seu plano de assinatura foi alterado para ${planName}.`;
    
    case 'trial_ending':
      const trialDaysLeft = details.daysRemaining || 1;
      return `Seu período de teste Premium termina em ${trialDaysLeft} ${
        trialDaysLeft === 1 ? 'dia' : 'dias'
      }. Adicione um método de pagamento para continuar com acesso Premium.`;
    
    default:
      return 'Houve uma atualização em sua assinatura Premium.';
  }
}

/**
 * Get the severity level for the notification
 */
function getSeverity(type: SubscriptionNotificationType): 'info' | 'warning' | 'critical' {
  switch (type) {
    case 'subscription_activated':
    case 'plan_changed':
      return 'info';
    
    case 'renewal_upcoming':
    case 'trial_ending':
      return 'warning';
    
    case 'payment_failed':
    case 'subscription_expired':
      return 'critical';
    
    default:
      return 'info';
  }
}

/**
 * Get the action URL for the notification
 */
function getActionUrl(type: SubscriptionNotificationType): string {
  switch (type) {
    case 'payment_failed':
      return '/payment-methods';
    case 'subscription_expired':
      return '/subscription';
    case 'trial_ending':
      return '/subscription';
    default:
      return '/account';
  }
}
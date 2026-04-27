import { toast as sonnerToast } from "sonner"

// Toast tipi için interface
interface ToastOptions {
  duration?: number
  description?: string
  action?: {
    label: string
    onClick: () => void
  }
  cancel?: {
    label: string
    onClick?: () => void
  }
}

// Türkçe toast yardımcıları
export const toast = {
  // Başarı mesajları
  success: (message: string, options?: ToastOptions) => {
    return sonnerToast.success(message, {
      duration: options?.duration || 4000,
      description: options?.description,
      action: options?.action ? {
        label: options.action.label,
        onClick: options.action.onClick,
      } : undefined,
      cancel: options?.cancel ? {
        label: options.cancel.label,
        onClick: options.cancel.onClick,
      } : undefined,
    })
  },

  // Hata mesajları
  error: (message: string, options?: ToastOptions) => {
    return sonnerToast.error(message, {
      duration: options?.duration || 5000,
      description: options?.description,
      action: options?.action ? {
        label: options.action.label,
        onClick: options.action.onClick,
      } : undefined,
    })
  },

  // Uyarı mesajları
  warning: (message: string, options?: ToastOptions) => {
    return sonnerToast.warning(message, {
      duration: options?.duration || 4500,
      description: options?.description,
      action: options?.action ? {
        label: options.action.label,
        onClick: options.action.onClick,
      } : undefined,
    })
  },

  // Bilgi mesajları
  info: (message: string, options?: ToastOptions) => {
    return sonnerToast.info(message, {
      duration: options?.duration || 4000,
      description: options?.description,
      action: options?.action ? {
        label: options.action.label,
        onClick: options.action.onClick,
      } : undefined,
    })
  },

  // Loading state (promise için)
  loading: (message: string) => {
    return sonnerToast.loading(message)
  },

  // Promise toast - async işlemler için
  promise: <T>(
    promise: Promise<T>,
    messages: {
      loading: string
      success: string | ((data: T) => string)
      error: string | ((error: Error) => string)
    }
  ) => {
    return sonnerToast.promise(promise, {
      loading: messages.loading,
      success: messages.success,
      error: messages.error,
    })
  },

  // Toast'ı kapat
  dismiss: (toastId?: string | number) => {
    return sonnerToast.dismiss(toastId)
  },

  // Özel toast
  custom: (message: string, options?: ToastOptions) => {
    return sonnerToast(message, {
      duration: options?.duration || 4000,
      description: options?.description,
    })
  },
}

// Yaygın kullanım senaryoları için hazır mesajlar
export const toastMessages = {
  // Kayıt işlemleri
  saveSuccess: () => toast.success("Başarıyla kaydedildi"),
  saveError: () => toast.error("Kaydetme sırasında bir hata oluştu"),
  
  // Silme işlemleri
  deleteSuccess: () => toast.success("Başarıyla silindi"),
  deleteError: () => toast.error("Silme sırasında bir hata oluştu"),
  
  // Güncelleme işlemleri
  updateSuccess: () => toast.success("Başarıyla güncellendi"),
  updateError: () => toast.error("Güncelleme sırasında bir hata oluştu"),
  
  // Form işlemleri
  formError: () => toast.error("Lütfen tüm alanları doğru şekilde doldurun"),
  formSuccess: () => toast.success("Form başarıyla gönderildi"),
  
  // Ağ hataları
  networkError: () => toast.error("Bağlantı hatası. Lütfen internet bağlantınızı kontrol edin."),
  serverError: () => toast.error("Sunucu hatası. Lütfen daha sonra tekrar deneyin."),
  
  // Yetkilendirme
  authRequired: () => toast.warning("Bu işlem için giriş yapmanız gerekiyor"),
  sessionExpired: () => toast.warning("Oturumunuz sona erdi. Lütfen tekrar giriş yapın."),
  
  // Yemek takibi
  mealAdded: () => toast.success("Yemek başarıyla eklendi", { 
    description: "Günlük kaloriniz güncellendi" 
  }),
  mealDeleted: () => toast.success("Yemek silindi"),
  mealUpdated: () => toast.success("Yemek güncellendi"),
  
  // Egzersiz takibi
  workoutAdded: () => toast.success("Egzersiz kaydedildi", {
    description: "Harika iş çıkardınız! 💪"
  }),
  workoutDeleted: () => toast.success("Egzersiz silindi"),
  
  // Su takibi
  waterAdded: (amount: number) => toast.success(`${amount} ml su eklendi`, {
    description: "Hidrasyon takibiniz güncellendi 💧"
  }),
  
  // Hedefler
  goalAchieved: (goalName: string) => toast.success(`Tebrikler! "${goalName}" hedefine ulaştınız! 🎉`),
  goalUpdated: () => toast.success("Hedefleriniz güncellendi"),
  
  // Profil
  profileUpdated: () => toast.success("Profiliniz güncellendi"),
  avatarUpdated: () => toast.success("Profil fotoğrafınız güncellendi"),
  
  // Genel
  copiedToClipboard: () => toast.success("Panoya kopyalandı"),
  settingsSaved: () => toast.success("Ayarlar kaydedildi"),
  
  // AI Coach
  aiThinking: () => toast.loading("AI Coach düşünüyor..."),
  aiResponse: () => toast.success("AI Coach yanıt verdi"),
  aiError: () => toast.error("AI Coach şu an yanıt veremiyor"),
}

export default toast

import { useCallback } from 'react'
import { sdk } from '@farcaster/miniapp-sdk'

export const useAddMiniApp = () => {
  const addMiniApp = useCallback(async () => {
    // MiniApp SDK normal tarayıcıda çalışmaz.
    // Farcaster embed ortamı yoksa sessizce geç.
    if (typeof window === 'undefined') return

    const isEmbedded =
      window.self !== window.top || (window as any).parent !== window

    if (!isEmbedded) return

    try {
      await sdk.actions.addMiniApp()
    } catch (error) {
      // MiniApp ortamı yoksa veya kullanıcı reddettiyse uygulamayı bozma
      console.warn('addMiniApp skipped:', error)
      return
    }
  }, [])

  return { addMiniApp }
}


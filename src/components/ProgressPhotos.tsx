interface ProgressPhotosProps {
  connection: SupabaseConnection | null; // ✅
}

export function ProgressPhotos({ connection }: ProgressPhotosProps) {
  const { language } = useLanguage();
  const [photos, setPhotos] = useState<ProgressPhoto[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<ProgressPhoto | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({ photoUrl: '', notes: '', weight: '' });

  const supabase = connection?.supabase;
  const userId = connection?.userId;

  useEffect(() => {
    // ✅ bağlantı yoksa "hazırlanıyor" durumunda kal, ama crash etme
    if (!supabase || !userId) {
      setIsLoading(true);
      return;
    }

    let channel: ReturnType<typeof supabase.channel> | null = null;

    const loadPhotos = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const { data, error } = await supabase
          .from('progress_photos')
          .select('*')
          .eq('identity', userId)  // (Aşağıda bu alan adı için not var)
          .order('date', { ascending: false });

        if (error) {
          console.error('Progress photos load error:', error);
          setError(language === 'tr' ? 'Fotoğraflar yüklenemedi' : 'Photos could not be loaded');
          return;
        }
        setPhotos(data || []);
      } catch (err) {
        console.error('Error loading photos:', err);
        setError(language === 'tr' ? 'Fotoğraflar yüklenemedi' : 'Photos could not be loaded');
      } finally {
        setIsLoading(false);
      }
    };

    loadPhotos();

    channel = supabase
      .channel(`progress_photos_${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'progress_photos',
          filter: `identity=eq.${userId}`,
        },
        () => loadPhotos()
      )
      .subscribe();

    return () => {
      if (channel) supabase.removeChannel(channel);
    };
  }, [supabase, userId, language]);

  // ✅ burada artık crash yok. connection yoksa düzgün loader:
  if (!supabase || !userId) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-600 mx-auto mb-4" />
          <p className="text-gray-600 font-doodle-alt">
            {language === 'tr' ? 'Bağlantı hazırlanıyor...' : 'Preparing connection...'}
          </p>
        </div>
      </div>
    );
  }

  // ... kalan render aynı
}

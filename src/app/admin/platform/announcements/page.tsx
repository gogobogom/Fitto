'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Bell, Plus, Trash2, Eye, X, CheckCircle, AlertCircle, Info, Megaphone, Upload, Image as ImageIcon } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

interface Announcement {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success' | 'promotion';
  imageUrl?: string;
  ctaText?: string;
  ctaLink?: string;
  targetAudience: 'all' | 'premium' | 'trial' | 'free';
  isActive: boolean;
  createdAt: number;
}

export default function AnnouncementsPage() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState<boolean>(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState<boolean>(false);
  const [previewData, setPreviewData] = useState<Announcement | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    message: '',
    type: 'info' as const,
    imageUrl: '',
    ctaText: '',
    ctaLink: '',
    targetAudience: 'all' as const,
  });

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const fetchAnnouncements = async () => {
    try {
      const response = await fetch('/api/admin/platform/announcements');
      const data = await response.json();
      setAnnouncements(data.announcements || []);
    } catch (error) {
      console.error('Failed to fetch announcements:', error);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Resmi base64'e çevir
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({ ...formData, imageUrl: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePreview = () => {
    setPreviewData({
      id: 'preview',
      title: formData.title || 'Başlık Giriniz',
      message: formData.message || 'Mesaj içeriğini giriniz...',
      type: formData.type,
      imageUrl: formData.imageUrl,
      ctaText: formData.ctaText,
      ctaLink: formData.ctaLink,
      targetAudience: formData.targetAudience,
      isActive: true,
      createdAt: Date.now(),
    });
    setIsPreviewOpen(true);
  };

  const handleCreate = async () => {
    try {
      const response = await fetch('/api/admin/platform/announcements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setIsDialogOpen(false);
        setFormData({
          title: '',
          message: '',
          type: 'info',
          imageUrl: '',
          ctaText: '',
          ctaLink: '',
          targetAudience: 'all',
        });
        fetchAnnouncements();
      }
    } catch (error) {
      console.error('Failed to create announcement:', error);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await fetch(`/api/admin/platform/announcements?id=${id}`, {
        method: 'DELETE',
      });
      fetchAnnouncements();
    } catch (error) {
      console.error('Failed to delete announcement:', error);
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'info':
        return <Info className="h-4 w-4 text-blue-600" />;
      case 'warning':
        return <AlertCircle className="h-4 w-4 text-yellow-600" />;
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'promotion':
        return <Megaphone className="h-4 w-4 text-purple-600" />;
      default:
        return <Info className="h-4 w-4" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'info':
        return 'bg-blue-100 text-blue-800';
      case 'warning':
        return 'bg-yellow-100 text-yellow-800';
      case 'success':
        return 'bg-green-100 text-green-800';
      case 'promotion':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-slate-100 text-slate-800';
    }
  };

  const getTypePreviewConfig = (type: string) => {
    switch (type) {
      case 'info':
        return { bg: 'bg-blue-500', icon: Info };
      case 'warning':
        return { bg: 'bg-yellow-500', icon: AlertCircle };
      case 'success':
        return { bg: 'bg-green-500', icon: CheckCircle };
      case 'promotion':
        return { bg: 'bg-purple-500', icon: Megaphone };
      default:
        return { bg: 'bg-blue-500', icon: Info };
    }
  };

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
            <Bell className="h-8 w-8 text-purple-600" />
            Announcements
          </h1>
          <p className="text-slate-600 mt-2">
            Kullanıcılara gösterilecek duyuru ve reklamları yönetin
          </p>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Yeni Duyuru
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Yeni Duyuru/Reklam Oluştur</DialogTitle>
              <DialogDescription>
                Kullanıcılara popup olarak gösterilecek duyuru veya reklam oluşturun
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="title">Başlık</Label>
                <Input
                  id="title"
                  placeholder="🎉 Yeni Özellik: AI Beslenme Koçu!"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="message">Mesaj</Label>
                <Textarea
                  id="message"
                  placeholder="Duyurunuzun detayını yazın..."
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  rows={4}
                />
              </div>

              {/* Resim Upload */}
              <div className="space-y-2">
                <Label htmlFor="image">Görsel (Opsiyonel)</Label>
                <div className="flex gap-4 items-start">
                  <div className="flex-1">
                    <Input
                      id="image"
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="cursor-pointer"
                    />
                    <p className="text-xs text-slate-500 mt-1">
                      veya URL girin:
                    </p>
                    <Input
                      placeholder="https://example.com/image.jpg"
                      value={formData.imageUrl}
                      onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                      className="mt-1"
                    />
                  </div>
                  {formData.imageUrl && (
                    <div className="w-32 h-32 border rounded-lg overflow-hidden flex-shrink-0">
                      <img 
                        src={formData.imageUrl} 
                        alt="Preview" 
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* CTA Alanları (Reklamlar için) */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="ctaText">Buton Metni (Opsiyonel)</Label>
                  <Input
                    id="ctaText"
                    placeholder="Hemen Dene"
                    value={formData.ctaText}
                    onChange={(e) => setFormData({ ...formData, ctaText: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ctaLink">Buton Linki (Opsiyonel)</Label>
                  <Input
                    id="ctaLink"
                    placeholder="https://..."
                    value={formData.ctaLink}
                    onChange={(e) => setFormData({ ...formData, ctaLink: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="type">Tip</Label>
                  <Select
                    value={formData.type}
                    onValueChange={(value: any) => setFormData({ ...formData, type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="info">Bilgi</SelectItem>
                      <SelectItem value="success">Başarı</SelectItem>
                      <SelectItem value="warning">Uyarı</SelectItem>
                      <SelectItem value="promotion">Reklam/Kampanya</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="target">Hedef Kitle</Label>
                  <Select
                    value={formData.targetAudience}
                    onValueChange={(value: any) => setFormData({ ...formData, targetAudience: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tüm Kullanıcılar</SelectItem>
                      <SelectItem value="premium">Sadece Premium</SelectItem>
                      <SelectItem value="trial">Sadece Trial</SelectItem>
                      <SelectItem value="free">Sadece Ücretsiz</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex gap-2 pt-4">
                <Button onClick={handlePreview} variant="outline" className="flex-1">
                  <Eye className="h-4 w-4 mr-2" />
                  Önizleme
                </Button>
                <Button onClick={handleCreate} className="flex-1">
                  Oluştur
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Preview Modal */}
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="max-w-md p-0 overflow-hidden">
          {previewData && (
            <div className="relative">
              {/* Preview Banner */}
              <div className="absolute top-0 left-0 right-0 bg-yellow-400 text-black text-xs font-bold text-center py-1 z-10">
                ÖNİZLEME MODU
              </div>

              {/* Actual Preview */}
              <div className="pt-6">
                {(() => {
                  const config = getTypePreviewConfig(previewData.type);
                  const Icon = config.icon;
                  return (
                    <div className="bg-white rounded-lg overflow-hidden">
                      {/* Header */}
                      <div className={`${config.bg} p-6 text-white relative`}>
                        <Icon className="w-12 h-12 mb-3" />
                        <h2 className="text-2xl font-bold mb-2">{previewData.title}</h2>
                        <button
                          className="absolute top-4 right-4 p-1 hover:bg-white/20 rounded-full transition-colors"
                          aria-label="Kapat"
                        >
                          <X className="w-6 h-6" />
                        </button>
                      </div>

                      {/* Body */}
                      <div className="p-6">
                        {/* Image */}
                        {previewData.imageUrl && (
                          <div className="mb-4 rounded-lg overflow-hidden">
                            <img 
                              src={previewData.imageUrl} 
                              alt={previewData.title}
                              className="w-full h-48 object-cover"
                            />
                          </div>
                        )}

                        {/* Message */}
                        <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                          {previewData.message}
                        </p>

                        {/* CTA Button */}
                        {previewData.ctaText && (
                          <button
                            className={`mt-4 w-full ${config.bg} text-white py-3 px-6 rounded-lg font-semibold hover:opacity-90 transition-opacity`}
                          >
                            {previewData.ctaText}
                          </button>
                        )}

                        {/* Default Action Button */}
                        {!previewData.ctaText && (
                          <button
                            className={`mt-6 w-full ${config.bg} text-white py-3 px-6 rounded-lg font-semibold hover:opacity-90 transition-opacity`}
                          >
                            Anladım
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Active Announcements */}
      <div className="space-y-4">
        {announcements.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Bell className="h-12 w-12 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-500">Henüz duyuru yok</p>
              <p className="text-sm text-slate-400 mt-1">İlk duyurunuzu oluşturun</p>
            </CardContent>
          </Card>
        ) : (
          announcements.map((announcement) => (
            <Card key={announcement.id}>
              <CardHeader>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      {getTypeIcon(announcement.type)}
                      <CardTitle className="text-lg">{announcement.title}</CardTitle>
                      <Badge className={getTypeColor(announcement.type)}>
                        {announcement.type === 'promotion' ? 'Reklam' : announcement.type}
                      </Badge>
                      <Badge variant="outline">
                        {announcement.targetAudience}
                      </Badge>
                      {announcement.imageUrl && (
                        <Badge variant="outline" className="text-xs">
                          <ImageIcon className="h-3 w-3 mr-1" />
                          Görselli
                        </Badge>
                      )}
                    </div>
                    <CardDescription className="line-clamp-2">{announcement.message}</CardDescription>
                    {announcement.imageUrl && (
                      <div className="mt-3 w-32 h-20 border rounded overflow-hidden">
                        <img 
                          src={announcement.imageUrl} 
                          alt={announcement.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(announcement.id)}
                  >
                    <Trash2 className="h-4 w-4 text-red-600" />
                  </Button>
                </div>
              </CardHeader>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}

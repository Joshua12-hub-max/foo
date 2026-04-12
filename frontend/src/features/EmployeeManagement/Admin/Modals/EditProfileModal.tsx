import React, { useState, useEffect, ChangeEvent } from 'react';
import { X, User, Mail, Camera, Save } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
// @ts-ignore
import { updateMyProfile } from '@api/employeeApi';

// Local schema for this modal
const EditProfileFormSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email format'),
  phoneNumber: z.string(),
  address: z.string(),
});

type EditProfileFormInput = z.infer<typeof EditProfileFormSchema>;

interface Profile {
  firstName?: string;
  lastName?: string;
  email?: string;
  phoneNumber?: string;
  address?: string;
  avatarUrl?: string;
}

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile?: Profile;
  onSave: (data: Profile) => void;
}


const EditProfileModal: React.FC<EditProfileModalProps> = ({
  isOpen,
  onClose,
  profile,
  onSave
}) => {
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<EditProfileFormInput>({
    resolver: zodResolver(EditProfileFormSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      phoneNumber: '',
      address: '',
    },
  });

  const firstName = watch('firstName');
  const lastName = watch('lastName');

  useEffect(() => {
    if (profile && isOpen) {
      reset({
        firstName: profile.firstName || '',
        lastName: profile.lastName || '',
        email: profile.email || '',
        phoneNumber: profile.phoneNumber || '',
        address: profile.address || '',
      });
      setAvatarPreview(profile.avatarUrl || null);
    }
  }, [profile, isOpen, reset]);

  const handleAvatarChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  const onFormSubmit = async (data: EditProfileFormInput) => {
    setLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('firstName', data.firstName);
      formData.append('lastName', data.lastName);
      formData.append('email', data.email);
      if (avatarFile) {
        formData.append('avatar', avatarFile);
      }

      const result = await updateMyProfile(formData);
      
      if (result.success && result.data) {
        onSave({
          firstName: result.data.firstName || undefined,
          lastName: result.data.lastName || undefined,
          email: result.data.email || undefined,
          phoneNumber: result.data.phoneNumber || undefined,
          address: result.data.address || undefined,
          avatarUrl: result.data.avatarUrl || undefined
        });
        onClose();
      } else {
        setError(result.message || 'Failed to update profile');
      }
    } catch (err) {
      setError('An error occurred while updating profile');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[100] p-4 animate-in fade-in duration-300">
      <div className="bg-white rounded-[var(--radius-lg)] w-full max-w-md shadow-2xl border border-[var(--zed-border-light)] overflow-hidden">
        {/* Header */}
        <div className="flex justify-between items-center px-6 py-5 border-b border-[var(--zed-border-light)] bg-gray-50/50">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-5 bg-[var(--zed-primary)] rounded-full" />
            <h2 className="text-base font-bold text-[var(--zed-text-dark)] tracking-tight">Edit profile settings</h2>
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-all">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onFormSubmit)} className="p-6 space-y-6">
          {/* Avatar */}
          <div className="flex justify-center">
            <div className="relative group">
              <div className="w-24 h-24 rounded-full overflow-hidden bg-gray-100 border-2 border-[var(--zed-border-light)] shadow-inner transition-transform group-hover:scale-105 duration-300">
                {avatarPreview ? (
                  <img src={avatarPreview} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[var(--zed-primary)] to-[var(--zed-accent)] text-white text-2xl font-black">
                    {firstName?.[0]}{lastName?.[0]}
                  </div>
                )}
              </div>
              <label className="absolute bottom-0 right-0 w-8 h-8 bg-white rounded-full shadow-lg flex items-center justify-center cursor-pointer hover:bg-gray-50 transition-all border border-[var(--zed-border-light)] group-hover:scale-110">
                <Camera size={14} className="text-[var(--zed-primary)]" />
                <input type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" />
              </label>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-100 text-red-600 text-[11px] font-bold p-3 rounded-[var(--radius-md)] flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
              {error}
            </div>
          )}

          {/* Fields */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-[var(--zed-text-muted)] tracking-widest ml-1 flex items-center gap-1 uppercase">
                First name
              </label>
              <input
                type="text"
                {...register('firstName')}
                className="w-full px-4 py-2.5 bg-gray-50/50 border border-gray-200 rounded-[var(--radius-md)] focus:bg-white focus:ring-4 focus:ring-blue-50 focus:border-[var(--zed-primary)] outline-none text-sm font-bold text-[var(--zed-text-dark)] transition-all"
              />
              {errors.firstName && <p className="text-red-500 text-[9px] font-bold ml-1">{errors.firstName.message}</p>}
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-[var(--zed-text-muted)] tracking-widest ml-1 flex items-center gap-1 uppercase">
                Last name
              </label>
              <input
                type="text"
                {...register('lastName')}
                className="w-full px-4 py-2.5 bg-gray-50/50 border border-gray-200 rounded-[var(--radius-md)] focus:bg-white focus:ring-4 focus:ring-blue-50 focus:border-[var(--zed-primary)] outline-none text-sm font-bold text-[var(--zed-text-dark)] transition-all"
              />
              {errors.lastName && <p className="text-red-500 text-[9px] font-bold ml-1">{errors.lastName.message}</p>}
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-[var(--zed-text-muted)] tracking-widest ml-1 flex items-center gap-1 uppercase">
              Email address
            </label>
            <input
              type="email"
              {...register('email')}
              className="w-full px-4 py-2.5 bg-gray-50/50 border border-gray-200 rounded-[var(--radius-md)] focus:bg-white focus:ring-4 focus:ring-blue-50 focus:border-[var(--zed-primary)] outline-none text-sm font-bold text-[var(--zed-text-dark)] transition-all"
            />
            {errors.email && <p className="text-red-500 text-[9px] font-bold ml-1">{errors.email.message}</p>}
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-6 border-t border-[var(--zed-border-light)] mt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 text-xs font-bold text-gray-500 bg-gray-100 hover:bg-gray-200 hover:text-red-700 rounded-[var(--radius-md)] transition-all active:scale-95"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-3 text-xs font-bold text-white bg-[var(--zed-primary)] hover:bg-[var(--zed-primary-hover)] rounded-[var(--radius-md)] shadow-lg shadow-[var(--zed-primary)]/20 transition-all disabled:opacity-50 flex items-center justify-center gap-2 active:scale-95"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <Save size={14} />
                  Save changes
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditProfileModal;

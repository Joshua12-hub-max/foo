import React, { useState, useEffect, ChangeEvent } from 'react';
import { X, User, Mail, Camera, Save } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
// @ts-ignore
import { updateMyProfile } from '@api/employeeApi';

// Local schema for this modal
const EditProfileFormSchema = z.object({
  first_name: z.string().min(1, 'First name is required'),
  last_name: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email format'),
  phone_number: z.string(),
  address: z.string(),
});

type EditProfileFormInput = z.infer<typeof EditProfileFormSchema>;

interface Profile {
  first_name?: string;
  last_name?: string;
  email?: string;
  phone_number?: string;
  address?: string;
  avatar_url?: string;
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
      first_name: '',
      last_name: '',
      email: '',
      phone_number: '',
      address: '',
    },
  });

  const firstName = watch('first_name');
  const lastName = watch('last_name');

  useEffect(() => {
    if (profile && isOpen) {
      reset({
        first_name: profile.first_name || '',
        last_name: profile.last_name || '',
        email: profile.email || '',
        phone_number: profile.phone_number || '',
        address: profile.address || '',
      });
      setAvatarPreview(profile.avatar_url || null);
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
      formData.append('first_name', data.first_name);
      formData.append('last_name', data.last_name);
      formData.append('email', data.email);
      if (avatarFile) {
        formData.append('avatar', avatarFile);
      }

      const result = await updateMyProfile(formData);
      
      if (result.success && result.data) {
        onSave({
          first_name: result.data.first_name || undefined,
          last_name: result.data.last_name || undefined,
          email: result.data.email || undefined,
          phone_number: result.data.phone_number || undefined,
          address: result.data.address || undefined,
          avatar_url: result.data.avatar_url || undefined
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
    <div className="fixed inset-0 bg-black/30 flex items-start justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-md shadow-xl mt-16 border border-gray-200 p-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-bold text-gray-800">Edit Profile</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4">
          {/* Avatar */}
          <div className="flex justify-center">
            <div className="relative">
              <div className="w-20 h-20 rounded-full overflow-hidden bg-gray-200 border-4 border-white">
                {avatarPreview ? (
                  <img src={avatarPreview} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gray-100 text-gray-600 text-xl font-bold">
                    {firstName?.[0]}{lastName?.[0]}
                  </div>
                )}
              </div>
              <label className="absolute bottom-0 right-0 w-7 h-7 bg-gray-100 rounded-full flex items-center justify-center cursor-pointer hover:bg-gray-200 transition-colors border border-gray-200">
                <Camera size={14} className="text-gray-500" />
                <input type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" />
              </label>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg">
              {error}
            </div>
          )}

          {/* Fields */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-gray-600 mb-1 block flex items-center gap-1">
                <User size={14} className="text-gray-400" /> First Name
              </label>
              <input
                type="text"
                {...register('first_name')}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-gray-300 text-sm"
              />
              {errors.first_name && <p className="text-red-500 text-xs mt-1">{errors.first_name.message}</p>}
            </div>
            <div>
              <label className="text-sm text-gray-600 mb-1 block flex items-center gap-1">
                <User size={14} className="text-gray-400" /> Last Name
              </label>
              <input
                type="text"
                {...register('last_name')}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-gray-300 text-sm"
              />
              {errors.last_name && <p className="text-red-500 text-xs mt-1">{errors.last_name.message}</p>}
            </div>
          </div>

          <div>
            <label className="text-sm text-gray-600 mb-1 block flex items-center gap-1">
              <Mail size={14} className="text-gray-400" /> Email
            </label>
            <input
              type="email"
              {...register('email')}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-gray-300 text-sm"
            />
            {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t border-gray-200 mt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 text-sm text-gray-600 bg-gray-100 hover:text-red-700 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2.5 text-sm text-white bg-gray-900 hover:bg-gray-800 rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-1"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Save size={14} />
                  Save Changes
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

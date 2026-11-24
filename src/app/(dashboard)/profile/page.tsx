"use client";

import React, { useState, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import {
  User,
  Lock,
  KeyRound,
  ShieldCheck,
  Mail,
  Phone,
  FileText,
  MapPin,
  Copy,
  Fingerprint,
  Trash2,
  Smartphone,
  Laptop,
  Camera,
  Upload,
  Sparkles,
  Check,
  Building,
  Briefcase,
  BadgeCheck,
  ShieldAlert,
  Calendar,
  Clock,
  HelpCircle,
} from "lucide-react";
import { formatDate } from "@/lib/utils";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  Button,
  Input,
  Badge,
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
  Modal,
} from "@/components/ui";
import { useAppSelector, useAppDispatch } from "@/redux/hooks";
import { updateUser } from "@/redux/slices/authSlice";
import {
  useUpdateProfileMutation,
  useChangePasswordMutation,
  useSetPinMutation,
  useGetMyPasskeysQuery,
  useDeletePasskeyMutation,
  useGetMeQuery,
  useGetMyPinResetRequestQuery,
  useSubmitPinResetRequestMutation,
} from "@/redux/api/authApi";
import {
  useGenerate2faMutation,
  useVerify2faMutation,
  useDisable2faMutation,
} from "@/redux/api/twoFactorApi";
import {
  changePasswordSchema,
  ChangePasswordInput,
  setPinSchema,
  SetPinInput,
  updateProfileSchema,
  UpdateProfileInput,
} from "@/lib/validations/auth";
import { ROLES } from "@/lib/constants";

// Preset modern avatars for instant 1-click selection
const PRESET_AVATARS = [
  {
    id: "exec",
    label: "Executive Suit",
    url: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&auto=format&fit=crop&q=80",
  },
  {
    id: "pro",
    label: "Professional",
    url: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80",
  },
  {
    id: "officer",
    label: "Branch Officer",
    url: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300&auto=format&fit=crop&q=80",
  },
  {
    id: "analyst",
    label: "Financial Analyst",
    url: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=300&auto=format&fit=crop&q=80",
  },
  {
    id: "tech",
    label: "Tech Director",
    url: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=300&auto=format&fit=crop&q=80",
  },
  {
    id: "finance",
    label: "Modern Banker",
    url: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=300&auto=format&fit=crop&q=80",
  },
];

export default function ProfilePage() {
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);

  const [updateProfileMutation, { isLoading: isUpdatingProfile }] =
    useUpdateProfileMutation();
  const [changePasswordMutation, { isLoading: isChangingPassword }] =
    useChangePasswordMutation();
  const [setPinMutation, { isLoading: isSettingPin }] = useSetPinMutation();

  // Avatar upload state
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [isSavingAvatar, setIsSavingAvatar] = useState(false);

  // 2FA Mutations & State
  const [generate2faMutation, { isLoading: isGenerating2fa }] =
    useGenerate2faMutation();
  const [verify2faMutation, { isLoading: isVerifying2fa }] =
    useVerify2faMutation();
  const [disable2faMutation, { isLoading: isDisabling2fa }] =
    useDisable2faMutation();

  const [is2faModalOpen, setIs2faModalOpen] = useState(false);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState("");
  const [totpSecret, setTotpSecret] = useState("");
  const [verificationCode, setVerificationCode] = useState("");

  const [isDisableModalOpen, setIsDisableModalOpen] = useState(false);
  const [disablePassword, setDisablePassword] = useState("");
  const [disableCode, setDisableCode] = useState("");

  const handleStart2faSetup = async () => {
    try {
      const res = await generate2faMutation().unwrap();
      setQrCodeDataUrl(res.qrCodeDataUrl);
      setTotpSecret(res.secret);
      setIs2faModalOpen(true);
    } catch {
      toast.error("Failed to generate 2FA credentials");
    }
  };

  const handleConfirm2fa = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!verificationCode || verificationCode.trim().length !== 6) {
      toast.error("Please enter a valid 6-digit TOTP code.");
      return;
    }
    try {
      const res = await verify2faMutation({
        token: verificationCode.trim(),
        secret: totpSecret,
      }).unwrap();
      toast.success(res.message);
      setIs2faModalOpen(false);
      setVerificationCode("");
    } catch (err: unknown) {
      const apiErr = err as { data?: { error?: string } };
      toast.error(apiErr.data?.error || "2FA verification failed.");
    }
  };

  const handleDisable2fa = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await disable2faMutation({
        password: disablePassword,
        token: disableCode.trim(),
      }).unwrap();
      toast.success(res.message);
      setIsDisableModalOpen(false);
      setDisablePassword("");
      setDisableCode("");
    } catch (err: unknown) {
      const apiErr = err as { data?: { error?: string } };
      toast.error(apiErr.data?.error || "Failed to disable 2FA.");
    }
  };

  // Passkey State & Handlers
  const { data: passkeysData, refetch: refetchPasskeys } = useGetMyPasskeysQuery();
  const [deletePasskeyMutation, { isLoading: isDeletingPasskey }] =
    useDeletePasskeyMutation();
  const passkeys = passkeysData?.passkeys || [];

  const [isPasskeyModalOpen, setIsPasskeyModalOpen] = useState(false);
  const [passkeyName, setPasskeyName] = useState("");
  const [isRegisteringPasskey, setIsRegisteringPasskey] = useState(false);

  const handleRegisterPasskey = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsRegisteringPasskey(true);
    try {
      const { browserSupportsWebAuthn, startRegistration } = await import(
        "@simplewebauthn/browser"
      );
      if (!browserSupportsWebAuthn()) {
        toast.error(
          "Passkeys/WebAuthn are not supported in this browser or over an insecure connection. (HTTPS or localhost is required)."
        );
        setIsRegisteringPasskey(false);
        return;
      }

      const token =
        typeof window !== "undefined" ? localStorage.getItem("auth_token") : null;
      const authHeaders: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (token) authHeaders["Authorization"] = `Bearer ${token}`;

      const optRes = await fetch("/api/auth/passkey/register-options", {
        method: "POST",
        headers: authHeaders,
        credentials: "include",
      });
      const optData = await optRes.json();
      if (!optData.success) {
        toast.error(optData.error || "Failed to initialize passkey registration");
        return;
      }

      const credential = await startRegistration({
        optionsJSON: optData.options,
      });

      const verifyRes = await fetch("/api/auth/passkey/register-verify", {
        method: "POST",
        headers: authHeaders,
        credentials: "include",
        body: JSON.stringify({
          credential,
          name: passkeyName.trim() || "Biometric Passkey",
          expectedChallenge: optData.options?.challenge,
        }),
      });
      const verifyData = await verifyRes.json();

      if (!verifyData.success) {
        toast.error(verifyData.error || "Failed to verify passkey");
        return;
      }

      toast.success(verifyData.message || "Passkey registered successfully!");
      setIsPasskeyModalOpen(false);
      setPasskeyName("");
      refetchPasskeys();
    } catch (err: unknown) {
      const error = err as Error;
      if (error.name === "NotAllowedError") {
        toast.info("Passkey registration was cancelled or timed out.");
      } else if (error.name === "InvalidStateError") {
        toast.warning("This authenticator is already registered for your account.");
      } else {
        toast.error(error.message || "Failed to register passkey.");
      }
    } finally {
      setIsRegisteringPasskey(false);
    }
  };

  const handleDeletePasskey = async (id: string, name: string) => {
    try {
      const res = await deletePasskeyMutation(id).unwrap();
      toast.success(res.message || `Passkey "${name}" revoked.`);
    } catch (err: unknown) {
      const apiErr = err as { data?: { error?: string } };
      toast.error(apiErr.data?.error || "Failed to revoke passkey.");
    }
  };

  // Client-side square center crop & WebP image compressor
  const compressImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement("canvas");
          const size = 320;
          canvas.width = size;
          canvas.height = size;
          const ctx = canvas.getContext("2d");
          if (!ctx) {
            resolve(img.src);
            return;
          }

          const minDim = Math.min(img.width, img.height);
          const startX = (img.width - minDim) / 2;
          const startY = (img.height - minDim) / 2;

          ctx.drawImage(img, startX, startY, minDim, minDim, 0, 0, size, size);
          const compressed = canvas.toDataURL("image/webp", 0.85);
          resolve(compressed);
        };
        img.onerror = (err) => reject(err);
      };
      reader.onerror = (err) => reject(err);
    });
  };

  // Handle local file selection
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image file size must be under 5MB.");
      return;
    }

    try {
      const compressed = await compressImage(file);
      setAvatarPreview(compressed);
    } catch {
      toast.error("Failed to process image file.");
    }
  };

  // Save selected avatar (uploaded or preset)
  const handleSaveAvatar = async (avatarUrlToSave?: string) => {
    const finalAvatar = avatarUrlToSave !== undefined ? avatarUrlToSave : avatarPreview;
    if (finalAvatar === null) return;

    setIsSavingAvatar(true);
    try {
      let resolvedAvatarUrl = finalAvatar;

      // If it's a local data URL (uploaded photo), upload to Cloudinary
      if (finalAvatar && finalAvatar.startsWith("data:")) {
        const uploadRes = await fetch("/api/upload", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ file: finalAvatar, folder: "avatars" }),
        });
        const uploadData = await uploadRes.json();
        if (!uploadData.success) {
          throw new Error(uploadData.error || "Failed to upload avatar to Cloudinary.");
        }
        resolvedAvatarUrl = uploadData.url;
      }

      const res = await updateProfileMutation({
        name: currentUser?.name || user?.name || "User",
        avatarUrl: resolvedAvatarUrl,
      }).unwrap();

      if (res.user) {
        dispatch(updateUser(res.user));
      }
      refetchMe();
      toast.success(
        resolvedAvatarUrl ? "Profile avatar saved to Cloudinary!" : "Profile photo removed."
      );
      setAvatarPreview(null);
    } catch (err: unknown) {
      const apiErr = err as { data?: { error?: string }; message?: string };
      toast.error(apiErr.data?.error || apiErr.message || "Failed to update profile photo.");
    } finally {
      setIsSavingAvatar(false);
    }
  };

  // Profile Form
  const {
    register: registerProfile,
    handleSubmit: handleProfileSubmit,
    formState: { errors: profileErrors },
  } = useForm<UpdateProfileInput>({
    resolver: zodResolver(updateProfileSchema),
    values: {
      name: user?.name || "",
      phone: user?.phone || "",
      nationalId: user?.nationalId || "",
      address: user?.address || "",
      avatarUrl: user?.avatarUrl || "",
    },
  });

  // Password Form
  const {
    register: registerPassword,
    handleSubmit: handlePasswordSubmit,
    reset: resetPasswordForm,
    formState: { errors: passwordErrors },
  } = useForm<ChangePasswordInput>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  const { data: meData, refetch: refetchMe } = useGetMeQuery();
  const currentUser = meData?.user || user;
  const hasExistingPin = Boolean(currentUser?.transactionPinSet);

  // PIN Reset Request State
  const { data: pinRequestData, refetch: refetchPinRequest } = useGetMyPinResetRequestQuery();
  const [submitPinResetMutation, { isLoading: isSubmittingPinReset }] =
    useSubmitPinResetRequestMutation();
  const [isPinResetModalOpen, setIsPinResetModalOpen] = useState(false);
  const [pinResetReason, setPinResetReason] = useState("");
  const [pinResetPassword, setPinResetPassword] = useState("");

  const handleRequestPinReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pinResetReason.trim() || pinResetReason.trim().length < 5) {
      toast.error("Please explain why you need your PIN reset (minimum 5 characters).");
      return;
    }
    try {
      const res = await submitPinResetMutation({
        reason: pinResetReason.trim(),
        password: pinResetPassword.trim() || undefined,
      }).unwrap();
      toast.success(res.message || "PIN reset request submitted to bank staff.");
      setIsPinResetModalOpen(false);
      setPinResetReason("");
      setPinResetPassword("");
      refetchPinRequest();
    } catch (err: unknown) {
      const apiErr = err as { data?: { error?: string } };
      toast.error(apiErr.data?.error || "Failed to submit PIN reset request.");
    }
  };

  // PIN Form
  const {
    register: registerPin,
    handleSubmit: handlePinSubmit,
    reset: resetPinForm,
    formState: { errors: pinErrors },
  } = useForm<SetPinInput>({
    resolver: zodResolver(setPinSchema),
    defaultValues: {
      currentPin: "",
      currentPassword: "",
      pin: "",
      confirmPin: "",
    },
  });

  const onUpdateProfile = async (data: UpdateProfileInput) => {
    try {
      const res = await updateProfileMutation(data).unwrap();
      if (res.user) {
        dispatch(updateUser(res.user));
      }
      toast.success(res.message || "Profile details updated successfully!");
    } catch (err: unknown) {
      const apiErr = err as { data?: { error?: string } };
      toast.error(apiErr.data?.error || "Profile update failed.");
    }
  };

  const onChangePassword = async (data: ChangePasswordInput) => {
    try {
      const res = await changePasswordMutation(data).unwrap();
      toast.success(res.message || "Password changed successfully!");
      resetPasswordForm();
    } catch (err: unknown) {
      const apiErr = err as { data?: { error?: string } };
      toast.error(apiErr.data?.error || "Password change failed.");
    }
  };

  const onSetPin = async (data: SetPinInput) => {
    try {
      const res = await setPinMutation(data).unwrap();
      toast.success(res.message || "Transaction PIN updated successfully!");
      if (currentUser) {
        dispatch(updateUser({ ...currentUser, transactionPinSet: true }));
      }
      refetchMe();
      refetchPinRequest();
      resetPinForm();
    } catch (err: unknown) {
      const apiErr = err as { data?: { error?: string } };
      toast.error(apiErr.data?.error || "Failed to set PIN.");
    }
  };

  const currentDisplayAvatar = avatarPreview || user?.avatarUrl;
  const roleBadgeVariant =
    user?.role === ROLES.ADMIN
      ? "primary"
      : user?.role === ROLES.STAFF
      ? "info"
      : "success";

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            Profile & Account Settings
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Personalize your banking profile photo, corporate details, biometric passkeys, and authorization PIN.
          </p>
        </div>

        {/* Identity Summary Card */}
        <Card className="p-6 overflow-hidden relative">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            <div className="flex items-center gap-5">
              {/* Avatar with Camera Overlay */}
              <div className="relative group">
                {currentDisplayAvatar ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={currentDisplayAvatar}
                    alt={user?.name || "User"}
                    className="h-20 w-20 rounded-2xl object-cover ring-2 ring-indigo-500/30 shadow-lg shadow-indigo-500/10"
                  />
                ) : (
                  <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-indigo-600 text-2xl font-bold text-white shadow-lg shadow-indigo-500/20">
                    {user?.name?.charAt(0).toUpperCase() || "U"}
                  </div>
                )}

                {/* Status Dot */}
                <span className="absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500 ring-2 ring-white dark:ring-slate-900">
                  <span className="h-2 w-2 rounded-full bg-white dark:bg-slate-900" />
                </span>

                {/* Quick Camera Trigger */}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  title="Upload profile image"
                  className="absolute inset-0 bg-slate-900/60 rounded-2xl opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center text-white transition-opacity cursor-pointer"
                >
                  <Camera className="h-5 w-5 mb-0.5" />
                  <span className="text-[10px] font-semibold">Change</span>
                </button>
              </div>

              {/* Name & Credentials */}
              <div className="space-y-1.5">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100">
                    {user?.name}
                  </h3>
                  <Badge variant={roleBadgeVariant} size="sm">
                    {user?.role === ROLES.ADMIN
                      ? "Super Admin"
                      : user?.role === ROLES.STAFF
                      ? "Staff Officer"
                      : "Premier Client"}
                  </Badge>
                  {user?.isVerified && (
                    <Badge variant="success" size="sm" dot>
                      Verified
                    </Badge>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 dark:text-slate-400">
                  <span className="flex items-center gap-1.5">
                    <Mail className="h-3.5 w-3.5" />
                    {user?.email}
                  </span>
                  {user?.createdAt && (
                    <span className="flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5" />
                      Member since {formatDate(user.createdAt)}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Quick Badges */}
            <div className="flex sm:flex-col items-end gap-2">
              <Badge variant={user?.transactionPinSet ? "success" : "warning"} size="sm" dot>
                {user?.transactionPinSet ? "PIN Active" : "PIN Setup Required"}
              </Badge>
              <Badge variant={user?.twoFactorEnabled ? "primary" : "outline"} size="sm">
                {user?.twoFactorEnabled ? "2FA Enabled" : "2FA Disabled"}
              </Badge>
            </div>
          </div>
        </Card>

        {/* Tabs for Profile / Security / PIN */}
        <Tabs defaultValue="profile">
          <TabsList>
            <TabsTrigger value="profile">Personal & Avatar</TabsTrigger>
            <TabsTrigger value="clearance">Role & Clearance</TabsTrigger>
            <TabsTrigger value="security">Password & Passkeys</TabsTrigger>
            <TabsTrigger value="pin">Transaction PIN</TabsTrigger>
          </TabsList>

          {/* Profile & Avatar Tab */}
          <TabsContent value="profile" className="space-y-6">
            {/* Modern Avatar Studio */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Camera className="h-5 w-5 text-indigo-500" />
                      Profile Avatar & Photography
                    </CardTitle>
                    <CardDescription>
                      Upload a photo of yourself or choose from high-definition banking avatars.
                    </CardDescription>
                  </div>
                  {user?.avatarUrl && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-rose-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20"
                      onClick={() => handleSaveAvatar("")}
                      isLoading={isSavingAvatar}
                    >
                      <Trash2 className="h-3.5 w-3.5 mr-1" />
                      Remove Photo
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Upload Action Area */}
                <div className="flex flex-col sm:flex-row items-center gap-6 p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800">
                  <div className="relative shrink-0">
                    {currentDisplayAvatar ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={currentDisplayAvatar}
                        alt="Preview"
                        className="h-24 w-24 rounded-2xl object-cover ring-4 ring-indigo-500/20 shadow-md"
                      />
                    ) : (
                      <div className="flex h-24 w-24 items-center justify-center rounded-2xl bg-indigo-600 text-3xl font-bold text-white shadow-md">
                        {user?.name?.charAt(0).toUpperCase() || "U"}
                      </div>
                    )}
                  </div>

                  <div className="space-y-2 text-center sm:text-left flex-1">
                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                      Upload Custom Photo
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Supported formats: JPG, PNG, WebP (up to 5MB). Automatically cropped and optimized into a crisp square avatar.
                    </p>

                    <div className="flex flex-wrap items-center gap-2 pt-1 justify-center sm:justify-start">
                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        accept="image/png, image/jpeg, image/jpg, image/webp"
                        className="hidden"
                      />
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        leftIcon={<Upload className="h-3.5 w-3.5" />}
                        onClick={() => fileInputRef.current?.click()}
                      >
                        Choose Image File
                      </Button>

                      {avatarPreview && (
                        <Button
                          type="button"
                          size="sm"
                          variant="primary"
                          isLoading={isSavingAvatar}
                          leftIcon={<Check className="h-3.5 w-3.5" />}
                          onClick={() => handleSaveAvatar()}
                        >
                          Save Uploaded Photo
                        </Button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Preset Avatars Gallery */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                      <Sparkles className="h-3.5 w-3.5 text-indigo-500" />
                      Or Choose a 1-Click Banking Avatar
                    </span>
                  </div>

                  <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
                    {PRESET_AVATARS.map((preset) => {
                      const isSelected = currentDisplayAvatar === preset.url;
                      return (
                        <button
                          key={preset.id}
                          type="button"
                          onClick={() => handleSaveAvatar(preset.url)}
                          className={`group relative flex flex-col items-center p-2 rounded-xl border transition-all ${
                            isSelected
                              ? "border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/40 ring-2 ring-indigo-500/20"
                              : "border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-900"
                          }`}
                        >
                          <div className="relative mb-1.5">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={preset.url}
                              alt={preset.label}
                              className="h-12 w-12 rounded-xl object-cover ring-1 ring-slate-200 dark:ring-slate-800 group-hover:scale-105 transition-transform"
                            />
                            {isSelected && (
                              <div className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-indigo-600 text-white flex items-center justify-center">
                                <Check className="h-2.5 w-2.5" />
                              </div>
                            )}
                          </div>
                          <span className="text-[10px] font-semibold text-slate-700 dark:text-slate-300 truncate w-full text-center">
                            {preset.label}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Personal Details Form */}
            <Card>
              <CardHeader>
                <CardTitle>Personal & Contact Details</CardTitle>
                <CardDescription>
                  Keep your banking contact information accurate and up to date for regulatory verification.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form
                  onSubmit={handleProfileSubmit(onUpdateProfile)}
                  className="space-y-4 max-w-2xl"
                >
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Input
                      label="Full Legal Name"
                      leftIcon={<User className="h-4 w-4" />}
                      error={profileErrors.name?.message}
                      {...registerProfile("name")}
                    />

                    <div>
                      <Input
                        label="Registered Email (Primary)"
                        type="email"
                        value={user?.email || ""}
                        disabled
                        leftIcon={<Mail className="h-4 w-4" />}
                        helperText="Corporate email is protected and managed by bank administration."
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Input
                      label="Direct Phone Number"
                      placeholder="+1 (555) 019-2834"
                      leftIcon={<Phone className="h-4 w-4" />}
                      error={profileErrors.phone?.message}
                      {...registerProfile("phone")}
                    />
                    <Input
                      label="National ID / Officer Badge"
                      placeholder="e.g. BD-892019"
                      leftIcon={<FileText className="h-4 w-4" />}
                      error={profileErrors.nationalId?.message}
                      {...registerProfile("nationalId")}
                    />
                  </div>

                  <Input
                    label="Official / Residential Address"
                    placeholder="e.g. 42 Wall Street, Financial District / Desk #4"
                    leftIcon={<MapPin className="h-4 w-4" />}
                    error={profileErrors.address?.message}
                    {...registerProfile("address")}
                  />

                  <div className="pt-2">
                    <Button
                      type="submit"
                      variant="primary"
                      isLoading={isUpdatingProfile}
                    >
                      Save Profile Changes
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Role & Clearance Tab */}
          <TabsContent value="clearance" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BadgeCheck className="h-5 w-5 text-indigo-500" />
                  Banking Protocol & Role Clearance
                </CardTitle>
                <CardDescription>
                  Operational authority and compliance clearance assigned to your credentials.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {user?.role === ROLES.ADMIN && (
                  <div className="p-5 rounded-2xl bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-200/80 dark:border-indigo-900/60 space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center">
                        <ShieldAlert className="h-5 w-5" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                          Super Administrator (Core Authority)
                        </h4>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          Root clearance over banking rules, staff provisioning, suspicious activity, and audit logs.
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                      <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-indigo-100 dark:border-indigo-900/50">
                        <span className="text-[10px] font-bold uppercase text-slate-400">Staff Desk Control</span>
                        <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 mt-0.5">Provision & Suspend</p>
                      </div>
                      <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-indigo-100 dark:border-indigo-900/50">
                        <span className="text-[10px] font-bold uppercase text-slate-400">Audit Trail Access</span>
                        <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 mt-0.5">Full Immutable Log</p>
                      </div>
                      <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-indigo-100 dark:border-indigo-900/50">
                        <span className="text-[10px] font-bold uppercase text-slate-400">KYC & Policy</span>
                        <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 mt-0.5">Universal Override</p>
                      </div>
                    </div>
                  </div>
                )}

                {user?.role === ROLES.STAFF && (
                  <div className="p-5 rounded-2xl bg-sky-50/60 dark:bg-sky-950/30 border border-sky-200/80 dark:border-sky-900/60 space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-xl bg-sky-600 text-white flex items-center justify-center">
                        <Briefcase className="h-5 w-5" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                          Branch Operations Staff Officer
                        </h4>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          Operational officer clearance authorized to register customers, verify KYC documents, and approve transactions.
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                      <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-sky-100 dark:border-sky-900/50">
                        <span className="text-[10px] font-bold uppercase text-slate-400">Station / Branch</span>
                        <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 mt-0.5">{user.address || "Main Operational Branch"}</p>
                      </div>
                      <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-sky-100 dark:border-sky-900/50">
                        <span className="text-[10px] font-bold uppercase text-slate-400">Document Review</span>
                        <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 mt-0.5">KYC, Cards & Loans</p>
                      </div>
                      <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-sky-100 dark:border-sky-900/50">
                        <span className="text-[10px] font-bold uppercase text-slate-400">Account Issuance</span>
                        <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 mt-0.5">Authorized Officer</p>
                      </div>
                    </div>
                  </div>
                )}

                {user?.role === ROLES.CUSTOMER && (
                  <div className="p-5 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200/80 dark:border-emerald-900/60 space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center">
                        <Building className="h-5 w-5" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                          Apex Premier Digital Banking Client
                        </h4>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          Active member tier with instant payments, biometric authorization, and multi-currency accounts.
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                      <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-emerald-100 dark:border-emerald-900/50">
                        <span className="text-[10px] font-bold uppercase text-slate-400">KYC Status</span>
                        <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 mt-0.5">
                          {user.isVerified ? "Full Regulatory Clearance" : "Pending Document Upload"}
                        </p>
                      </div>
                      <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-emerald-100 dark:border-emerald-900/50">
                        <span className="text-[10px] font-bold uppercase text-slate-400">Security Tier</span>
                        <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 mt-0.5">
                          {user.twoFactorEnabled ? "Dual-Factor Protected" : "Standard Single-Factor"}
                        </p>
                      </div>
                      <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-emerald-100 dark:border-emerald-900/50">
                        <span className="text-[10px] font-bold uppercase text-slate-400">Transaction PIN</span>
                        <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 mt-0.5">
                          {user.transactionPinSet ? "4-Digit PIN Active" : "Not Set"}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Password & Security Tab */}
          <TabsContent value="security" className="space-y-6">
            {/* Change Password Card */}
            <Card>
              <CardHeader>
                <CardTitle>Change Password</CardTitle>
                <CardDescription>
                  Ensure your account is protected with a strong, distinct password.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form
                  onSubmit={handlePasswordSubmit(onChangePassword)}
                  className="space-y-4 max-w-xl"
                >
                  <Input
                    label="Current Password"
                    type="password"
                    leftIcon={<Lock className="h-4 w-4" />}
                    error={passwordErrors.currentPassword?.message}
                    {...registerPassword("currentPassword")}
                  />

                  <Input
                    label="New Password"
                    type="password"
                    leftIcon={<Lock className="h-4 w-4" />}
                    error={passwordErrors.newPassword?.message}
                    {...registerPassword("newPassword")}
                  />

                  <Input
                    label="Confirm New Password"
                    type="password"
                    leftIcon={<Lock className="h-4 w-4" />}
                    error={passwordErrors.confirmPassword?.message}
                    {...registerPassword("confirmPassword")}
                  />

                  <Button
                    type="submit"
                    isLoading={isChangingPassword}
                    className="mt-2"
                  >
                    Update Password
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Two-Factor Authentication Card */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <ShieldCheck className="h-5 w-5 text-indigo-500" />
                      Two-Factor Authentication (TOTP)
                    </CardTitle>
                    <CardDescription>
                      Protect your banking access by requiring a time-based 6-digit code.
                    </CardDescription>
                  </div>
                  <Badge
                    variant={user?.twoFactorEnabled ? "success" : "warning"}
                    dot
                  >
                    {user?.twoFactorEnabled ? "Enabled" : "Disabled"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  When enabled, signing in requires your password and an authenticator app code (Google Authenticator, Microsoft Authenticator, or 1Password).
                </p>

                {user?.twoFactorEnabled ? (
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => setIsDisableModalOpen(true)}
                  >
                    Disable Two-Factor Authentication
                  </Button>
                ) : (
                  <Button
                    variant="primary"
                    size="sm"
                    isLoading={isGenerating2fa}
                    onClick={handleStart2faSetup}
                  >
                    Configure Authenticator App
                  </Button>
                )}
              </CardContent>
            </Card>

            {/* Passkeys & Biometrics Management Card */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Fingerprint className="h-5 w-5 text-indigo-500" />
                      Passkeys & Biometric Logins
                    </CardTitle>
                    <CardDescription>
                      Log in seamlessly without passwords using Touch ID, Face ID, Windows Hello, or FIDO2 Security Keys.
                    </CardDescription>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    leftIcon={<Fingerprint className="h-4 w-4" />}
                    onClick={() => {
                      setPasskeyName("");
                      setIsPasskeyModalOpen(true);
                    }}
                  >
                    Add a Passkey
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {passkeys.length === 0 ? (
                  <div className="p-6 text-center rounded-xl border border-dashed border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30">
                    <Fingerprint className="h-8 w-8 text-slate-400 mx-auto mb-2" />
                    <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      No passkeys registered yet
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      Register this device&apos;s fingerprint or facial scanner for instant passwordless banking.
                    </p>
                    <Button
                      variant="primary"
                      size="sm"
                      className="mt-3"
                      leftIcon={<Fingerprint className="h-3.5 w-3.5" />}
                      onClick={() => {
                        setPasskeyName("");
                        setIsPasskeyModalOpen(true);
                      }}
                    >
                      Register This Device
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {passkeys.map((pk) => (
                      <div
                        key={pk._id}
                        className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/40"
                      >
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                            {pk.deviceType === "multiDevice" ? (
                              <Smartphone className="h-4 w-4" />
                            ) : (
                              <Laptop className="h-4 w-4" />
                            )}
                          </div>
                          <div>
                            <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                              {pk.name}
                            </p>
                            <p className="text-[10px] text-slate-400">
                              Enrolled {formatDate(pk.createdAt)}
                              {pk.lastUsedAt && ` • Last used ${formatDate(pk.lastUsedAt)}`}
                            </p>
                          </div>
                        </div>

                        <Button
                          variant="outline"
                          size="sm"
                          className="text-rose-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20"
                          isLoading={isDeletingPasskey}
                          onClick={() => handleDeletePasskey(pk._id, pk.name)}
                          title="Revoke passkey"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* PIN Tab */}
          <TabsContent value="pin">
            <div className="space-y-4">
              {/* Informational Banner: Pending Staff Review */}
              {pinRequestData?.request?.status === "PENDING" && (
                <div className="p-4 rounded-xl border border-amber-300 dark:border-amber-800 bg-amber-50/70 dark:bg-amber-950/30 flex items-start gap-3">
                  <Clock className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5 animate-pulse" />
                  <div className="text-xs text-amber-900 dark:text-amber-200">
                    <p className="font-semibold text-sm">PIN Reset Request Under Staff Review</p>
                    <p className="mt-1 text-slate-700 dark:text-slate-300 leading-relaxed">
                      Your PIN reset request was submitted on {formatDate(pinRequestData.request.createdAt)}.
                      Reason: &quot;{pinRequestData.request.reason}&quot;.
                    </p>
                    <p className="mt-1 text-[11px] text-amber-700 dark:text-amber-400 font-medium">
                      Bank officers are verifying your customer record. Once approved, your transaction PIN will be cleared so you can setup a new PIN immediately.
                    </p>
                  </div>
                </div>
              )}

              {/* Informational Banner: Recently Approved by Staff */}
              {pinRequestData?.request?.status === "APPROVED" && !hasExistingPin && (
                <div className="p-4 rounded-xl border border-emerald-300 dark:border-emerald-800 bg-emerald-50/70 dark:bg-emerald-950/30 flex items-start gap-3">
                  <Check className="h-5 w-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                  <div className="text-xs text-emerald-900 dark:text-emerald-200">
                    <p className="font-semibold text-sm">PIN Reset Approved by Bank Staff</p>
                    <p className="mt-1 text-slate-700 dark:text-slate-300">
                      {pinRequestData.request.adminRemarks || "Your transaction PIN has been cleared. Please setup your new 4-digit PIN below."}
                    </p>
                  </div>
                </div>
              )}

              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <KeyRound className="h-5 w-5 text-indigo-500" />
                      {hasExistingPin ? "Change Transaction PIN" : "Setup Transaction PIN"}
                    </CardTitle>
                    <Badge variant={hasExistingPin ? "success" : "warning"} size="sm">
                      {hasExistingPin ? "PIN Active & Secured" : "Not Configured"}
                    </Badge>
                  </div>
                  <CardDescription>
                    {hasExistingPin
                      ? "Enter your current PIN (or account password) to verify your authorization before setting a new 4-digit PIN."
                      : "Create a confidential 4-digit PIN to authorize money transfers, Bangla QR payments, and mobile recharges."}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form
                    onSubmit={handlePinSubmit(onSetPin)}
                    className="space-y-4 max-w-sm"
                  >
                    {hasExistingPin && (
                      <div className="space-y-1.5">
                        <Input
                          label="Current 4-Digit PIN (or Account Password)"
                          type="password"
                          placeholder="•••• or current password"
                          leftIcon={<Lock className="h-4 w-4" />}
                          error={pinErrors.currentPin?.message}
                          {...registerPin("currentPin")}
                          required
                        />
                        <div className="flex items-center justify-between pt-0.5">
                          <p className="text-[11px] text-slate-500 dark:text-slate-400">
                            Current PIN or account password verifies authorization.
                          </p>
                          <button
                            type="button"
                            onClick={() => {
                              setPinResetReason("");
                              setPinResetPassword("");
                              setIsPinResetModalOpen(true);
                            }}
                            className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 hover:underline inline-flex items-center gap-1"
                          >
                            <HelpCircle className="h-3 w-3" />
                            Forgot PIN? Request Reset
                          </button>
                        </div>
                      </div>
                    )}

                    <Input
                      label={hasExistingPin ? "New 4-Digit PIN" : "4-Digit PIN"}
                      type="password"
                      maxLength={4}
                      placeholder="••••"
                      leftIcon={<Lock className="h-4 w-4" />}
                      error={pinErrors.pin?.message}
                      {...registerPin("pin")}
                      required
                    />

                    <Input
                      label={hasExistingPin ? "Confirm New 4-Digit PIN" : "Confirm 4-Digit PIN"}
                      type="password"
                      maxLength={4}
                      placeholder="••••"
                      leftIcon={<Lock className="h-4 w-4" />}
                      error={pinErrors.confirmPin?.message}
                      {...registerPin("confirmPin")}
                      required
                    />

                    <Button type="submit" isLoading={isSettingPin}>
                      {hasExistingPin ? "Update Transaction PIN" : "Save Transaction PIN"}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        {/* Modal: Enable 2FA */}
        <Modal
          isOpen={is2faModalOpen}
          onClose={() => setIs2faModalOpen(false)}
          title="Enable Two-Factor Authentication"
          description="Scan the QR code with your authenticator app (Google Authenticator, Microsoft Authenticator, or 1Password)."
        >
          <form onSubmit={handleConfirm2fa} className="space-y-4 pt-2">
            {qrCodeDataUrl && (
              <div className="flex flex-col items-center justify-center p-4 rounded-2xl bg-white border border-slate-200 dark:border-slate-800">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={qrCodeDataUrl}
                  alt="2FA QR Code"
                  className="w-48 h-48 rounded-xl shadow-md"
                />
                <div className="mt-3 text-center">
                  <p className="text-[11px] text-slate-500 mb-1">
                    Or manually enter this secret key:
                  </p>
                  <div className="flex items-center gap-2 justify-center">
                    <code className="text-xs font-mono font-bold text-slate-800 bg-slate-100 px-2 py-1 rounded">
                      {totpSecret}
                    </code>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(totpSecret);
                        toast.success("Secret copied!");
                      }}
                      className="p-1 hover:text-indigo-600 text-slate-500"
                    >
                      <Copy className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            )}

            <Input
              label="Enter 6-Digit Code from App"
              placeholder="000000"
              maxLength={6}
              value={verificationCode}
              onChange={(e) =>
                setVerificationCode(e.target.value.replace(/\D/g, ""))
              }
              className="text-center font-mono font-bold text-lg tracking-widest"
              required
            />

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIs2faModalOpen(false)}
              >
                Cancel
              </Button>
              <Button size="sm" type="submit" isLoading={isVerifying2fa}>
                Verify & Activate 2FA
              </Button>
            </div>
          </form>
        </Modal>

        {/* Modal: Disable 2FA */}
        <Modal
          isOpen={isDisableModalOpen}
          onClose={() => setIsDisableModalOpen(false)}
          title="Disable Two-Factor Authentication"
          description="Confirm with your account password and current authenticator code to turn off 2FA."
        >
          <form onSubmit={handleDisable2fa} className="space-y-4 pt-2">
            <Input
              label="Account Password"
              type="password"
              placeholder="••••••••••••"
              value={disablePassword}
              onChange={(e) => setDisablePassword(e.target.value)}
              required
            />

            <Input
              label="Current 6-Digit TOTP Code"
              type="text"
              maxLength={6}
              placeholder="000000"
              value={disableCode}
              onChange={(e) =>
                setDisableCode(e.target.value.replace(/\D/g, ""))
              }
              className="font-mono text-center tracking-widest font-bold"
              required
            />

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsDisableModalOpen(false)}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                variant="danger"
                type="submit"
                isLoading={isDisabling2fa}
              >
                Confirm & Disable 2FA
              </Button>
            </div>
          </form>
        </Modal>

        {/* Modal: Register Passkey */}
        <Modal
          isOpen={isPasskeyModalOpen}
          onClose={() => {
            if (!isRegisteringPasskey) {
              setIsPasskeyModalOpen(false);
            }
          }}
          title="Register Passkey / Biometrics"
          description="Use Touch ID, Face ID, Windows Hello, or a FIDO2 Security Key for secure, passwordless authentication."
        >
          <form onSubmit={handleRegisterPasskey} className="space-y-4 pt-2">
            <div className="p-3.5 rounded-xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/60 flex items-start gap-3">
              <div className="h-8 w-8 rounded-lg bg-indigo-100 dark:bg-indigo-900/80 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5">
                <Fingerprint className="h-4 w-4" />
              </div>
              <div className="text-xs text-indigo-950 dark:text-indigo-200">
                <p className="font-semibold mb-0.5">Hardware-Backed Security</p>
                <p className="text-[11px] text-indigo-700/80 dark:text-indigo-300/80 leading-relaxed">
                  Your biometric data never leaves your device. Only cryptographic public keys are verified by our bank server.
                </p>
              </div>
            </div>

            <Input
              label="Device / Key Nickname"
              placeholder="e.g. MacBook Pro Touch ID, Personal iPhone, Windows Hello"
              value={passkeyName}
              onChange={(e) => setPasskeyName(e.target.value)}
              helperText="Give this passkey a friendly name so you can identify it later."
            />

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <Button
                variant="outline"
                size="sm"
                type="button"
                disabled={isRegisteringPasskey}
                onClick={() => setIsPasskeyModalOpen(false)}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                variant="primary"
                type="submit"
                isLoading={isRegisteringPasskey}
                leftIcon={<Fingerprint className="h-4 w-4" />}
              >
                {isRegisteringPasskey ? "Waiting for Biometric..." : "Scan & Save Passkey"}
              </Button>
            </div>
          </form>
        </Modal>

        {/* Modal: Request PIN Reset */}
        <Modal
          isOpen={isPinResetModalOpen}
          onClose={() => setIsPinResetModalOpen(false)}
          title="Request Transaction PIN Reset"
          description="Submit an official request to bank staff to review and clear your transaction PIN."
        >
          <form onSubmit={handleRequestPinReset} className="space-y-4 pt-2">
            <div className="p-3.5 rounded-xl bg-amber-50/70 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 flex items-start gap-3">
              <KeyRound className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <div className="text-xs text-amber-950 dark:text-amber-200">
                <p className="font-semibold mb-0.5">Staff Security Clearance Required</p>
                <p className="text-[11px] text-amber-800 dark:text-amber-300 leading-relaxed">
                  For your financial protection, bank staff will review your request against your registered depository records. Once approved, you can immediately configure a new 4-digit PIN.
                </p>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Reason for Reset Request <span className="text-rose-500">*</span>
              </label>
              <textarea
                rows={3}
                value={pinResetReason}
                onChange={(e) => setPinResetReason(e.target.value)}
                placeholder="e.g. Forgot current PIN after device reset, or locked out."
                className="w-full text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-2 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
              />
            </div>

            <Input
              label="Account Password (Optional verification)"
              type="password"
              placeholder="••••••••••••"
              value={pinResetPassword}
              onChange={(e) => setPinResetPassword(e.target.value)}
              helperText="Enter your login password to speed up officer verification."
            />

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <Button
                variant="outline"
                size="sm"
                type="button"
                onClick={() => setIsPinResetModalOpen(false)}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                variant="primary"
                type="submit"
                isLoading={isSubmittingPinReset}
                leftIcon={<KeyRound className="h-4 w-4" />}
              >
                Submit Request to Staff
              </Button>
            </div>
          </form>
        </Modal>
      </div>
    </DashboardLayout>
  );
}

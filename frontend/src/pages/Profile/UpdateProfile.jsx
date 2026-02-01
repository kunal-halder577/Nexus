import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Camera, Loader2, Save, Upload, User, Check, X } from "lucide-react"; // Added 'X' icon

// Shadcn UI Imports
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ImageCropperDialog } from "@/components/ImageCropperDialog";

// --- Zod Schema ---
const profileFormSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters.").max(50),
  username: z
    .string()
    .min(3, "Username must be at least 3 characters")
    .max(20, "Username must be at most 20 characters")
    .regex(/^[a-zA-Z0-9_]+$/, "Only letters, numbers, and underscores allowed"),
  bio: z
    .string()
    .max(160)
    .optional(),
  age: z.preprocess(
    (val) => (val === ""? undefined : val),
    z.coerce
    .number()
    .min(13, "You must be at least 13.")
    .max(120)
    .optional(),
  ),
  gender: z.enum(["male", "female", "others"], {
    required_error: "Please select a gender.",
  })
    .optional()
    .or(z.literal("")),
  location: z
    .string()
    .max(50)
    .optional(),
  website: z
    .string()
    .url()
    .optional()
    .or(z.literal("")),
});

export default function UpdateProfilePage({ 
  user, 
  updateProfile, 
  updateAvatar, 
  isLoadingProfile, 
  isLoadingAvatar,
  onCancel 
}) {
  // const { toast } = useToast();
  const fileInputRef = useRef(null);

  // --- Avatar State ---
  const [selectedFile, setSelectedFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(user?.avatarUrl || "");
  
  // --- Cropper State ---
  const [cropDialogOpen, setCropDialogOpen] = useState(false);
  const [tempImgSrc, setTempImgSrc] = useState(null);
  
  // --- Default Values ---
  const defaultValues = {
    name: user?.name || "",
    username: user?.username || "",
    bio: user?.bio || "",
    age: (user?.age !== null && user?.age !== undefined) ? String(user.age) : "",
    // Force lowercase/trim immediately
    gender: user?.gender ? user.gender.toLowerCase().trim() : "", 
    location: user?.location || "",
    website: user?.website || "",
  };

  // --- Profile Form Hook ---
  const form = useForm({
    resolver: zodResolver(profileFormSchema),
    defaultValues: defaultValues,
    mode: "onChange",
  });

  // FIX 1: Removed 'selectedFile' from dependencies.
  // Now, the form ONLY resets when the actual user data from the DB changes.
  useEffect(() => {
    if (user) {
      const clearUser = defaultValues;
      form.reset(clearUser);
      // Only set the preview to the user's url if we haven't selected a new file yet
      if (!selectedFile) {
        setImagePreview(user.avatarUrl || "");
      }
    }
  }, [user, form]);

  // ==========================
  // HANDLER 1: Avatar Upload
  // ==========================
  const handleFileChange = (event) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 8 * 1024 * 1024) return; 
      
      const reader = new FileReader();
      reader.addEventListener("load", () => {
        setTempImgSrc(reader.result?.toString() || "");
        setCropDialogOpen(true); // Open the child component
      });
      reader.readAsDataURL(file);
    }
    // Reset input so they can select the same file again if they messed up cropping
    event.target.value = "";
  };
  const onCropFinished = (croppedFile) => {
    setSelectedFile(croppedFile);
    setImagePreview(URL.createObjectURL(croppedFile));
    // Dialog closes automatically via setOpen in child, 
    // or we can force it here: setCropDialogOpen(false);
  };

  // FIX 2 (Part B): New function to cancel the selection and revert preview
  const handleCancelSelection = () => {
    setSelectedFile(null);
    setImagePreview(user?.avatarUrl || "");
  };

  const onAvatarSubmit = async () => {
    if (!selectedFile) return;
    try {
      const formData = new FormData();
      formData.append("avatar", selectedFile, "avatar.jpg");
      await updateAvatar(formData).unwrap();
      setSelectedFile(null);
    } catch (error) { console.error(error); }
  };

  // ==========================
  // HANDLER 2: Profile Data
  // ==========================
 const onProfileSubmit = async (data) => {
    // GUARD 1: RHF check (The UI button is likely disabled, but this is a safety net)
    if (!form.formState.isDirty) return;

    // GUARD 2: Deep Comparison (The "Upgrade")
    // Check if the new data is effectively the same as the old user data
    const isActuallyChanged = Object.keys(data).some((key) => {
      let newValue = data[key];
      let oldValue = user?.[key];

      // Normalization 1: Trim strings to ignore accidental trailing spaces
      if (typeof newValue === "string") newValue = newValue.trim();
      if (typeof oldValue === "string") oldValue = oldValue.trim();

      // Normalization 2: Treat null, undefined, and empty strings as identical
      const isEmptyNew = newValue === "" || newValue === null || newValue === undefined;
      const isEmptyOld = oldValue === "" || oldValue === null || oldValue === undefined;

      // If both are "empty", no change detected for this field
      if (isEmptyNew && isEmptyOld) return false;

      // Strict comparison for everything else
      return newValue !== oldValue;
    });

    // If our manual check says nothing changed, stop here.
    if (!isActuallyChanged) {
      console.log("No semantic changes detected. API call skipped.");
      // toast({ description: "No changes to save." });
      
      // Optional: Reset form state to 'pristine' so the button disables again
      form.reset(data); 
      return;
    }

    try {
      // Clean up empty optional fields for the API
      if (!data.website) delete data.website;

      // Call the specialized Profile mutation
      await updateProfile(data).unwrap();
      
      // Reset the form with the new data so 'isDirty' resets to false
      form.reset(data);

      // toast({ title: "Profile Updated", description: "Your details have been saved." });
    } catch (error) {
      // toast({ title: "Error", description: "Failed to update profile.", variant: "destructive" });
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground py-10 px-4 sm:px-6 lg:px-8">
      <ImageCropperDialog 
        open={cropDialogOpen}
        setOpen={setCropDialogOpen}
        imageSrc={tempImgSrc}
        onCropComplete={onCropFinished}
      />
      <div className="max-w-3xl mx-auto space-y-8">
        
        <div>
          <h3 className="text-2xl font-bold tracking-tight">Account Settings</h3>
          <p className="text-sm text-muted-foreground mt-2">
            Manage your profile details and preferences.
          </p>
        </div>

        {/* SECTION 1: AVATAR CONTROLLER */}
        <Card>
          <CardHeader>
            <CardTitle>Profile Picture</CardTitle>
            <CardDescription>Click the image to upload a new avatar.</CardDescription>
          </CardHeader>
          <CardContent className="flex items-center gap-6">
            
            <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
              <Avatar className="h-24 w-24 border-2 border-border">
                <AvatarImage src={imagePreview} className="object-cover" />
                <AvatarFallback className="text-lg bg-muted">
                  {user?.name?.slice(0, 2).toUpperCase() || "US"}
                </AvatarFallback>
              </Avatar>
              <div className="absolute inset-0 rounded-full bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <Camera className="w-6 h-6 text-white" />
              </div>
            </div>

            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileChange} 
              className="hidden" 
              accept="image/*"
            />
            
            {/* Logic for Action Buttons */}
            {selectedFile ? (
               <div className="flex flex-col gap-2 animate-in fade-in zoom-in duration-300">
                  <div className="flex items-center gap-2">
                    <Button onClick={onAvatarSubmit} disabled={isLoadingAvatar} size="sm" className={'cursor-pointer'}>
                      {isLoadingAvatar ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
                      Save New Picture
                    </Button>
                    
                    {/* FIX 2 (Part C): The Revert Button */}
                    <Button 
                        type="button" 
                        variant="destructive" 
                        size="icon" 
                        className="h-9 w-9 cursor-pointer" 
                        onClick={handleCancelSelection}
                        disabled={isLoadingAvatar}
                        title="Cancel selection"
                    >
                        <X className="h-4 w-4" />
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">Click Save to apply changes.</p>
               </div>
            ) : (
                <div className="text-sm text-muted-foreground">
                    <p>Allowed: JPG, PNG, WEBP.</p>
                    <p>Max size: 8MB.</p>
                </div>
            )}
          </CardContent>
        </Card>

        {/* SECTION 2: PROFILE DATA CONTROLLER */}
        <Card>
          <CardHeader>
            <CardTitle>Personal Information</CardTitle>
            <CardDescription>Update your public profile details.</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onProfileSubmit)} className="space-y-6">
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Name */}
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Display Name</FormLabel>
                        <FormControl><Input placeholder="Alex Sterling" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Username */}
                  <FormField
                    control={form.control}
                    name="username"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Username</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <span className="absolute left-3 top-2.5 text-muted-foreground text-sm">@</span>
                            <Input className="pl-7" placeholder="asterling" {...field} />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* AGE */}
                  <FormField
                    control={form.control}
                    name="age"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Age</FormLabel>
                        <FormControl>
                          <Input type="number" placeholder="25" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* GENDER */}
                  <FormField
                    control={form.control}
                    name="gender"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Gender</FormLabel>
                        <Select 
                          onValueChange={field.onChange} 
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select gender" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="male">Male</SelectItem>
                            <SelectItem value="female">Female</SelectItem>
                            <SelectItem value="others">Others</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <Separator />

                <FormField
                  control={form.control}
                  name="bio"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Bio</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Tell us about yourself" className="resize-none min-h-[100px]" {...field} />
                      </FormControl>
                      <FormDescription className="text-right text-xs">
                        {field.value?.length || 0}/160
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="website"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Website</FormLabel>
                        <FormControl><Input placeholder="https://example.com" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="location"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Location</FormLabel>
                        <FormControl><Input placeholder="San Francisco, CA" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="flex justify-end gap-4">
                  <Button 
                    type="button" 
                    variant="ghost" 
                    onClick={onCancel}
                    className={'cursor-pointer'}
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    className={'cursor-pointer'}
                    disabled={isLoadingProfile || !form.formState.isDirty}
                  >
                    {isLoadingProfile && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Save Changes
                  </Button>
                </div>

              </form>
            </Form>
          </CardContent>
        </Card>

      </div>
    </div>
  );
}
import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { useGetUserByIdQuery } from '@/features/user/api/userApi';
import { useEditUserProfileMutation } from '@/features/admin/api/adminApi';
import { toast } from 'sonner';

const adminEditProfileSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters.").max(50),
  username: z
    .string()
    .min(3, "Username must be at least 3 characters")
    .max(20, "Username must be at most 20 characters")
    .regex(/^[a-zA-Z0-9_]+$/, "Only letters, numbers, and underscores allowed"),
  email: z.string().email("Invalid email format"),
  age: z.preprocess(
    (val) => (val === "" ? undefined : val),
    z.coerce.number().min(1, "Invalid age").max(120).optional()
  ),
  gender: z.enum(["male", "female", "others"], {
    required_error: "Please select a gender.",
  }).optional().or(z.literal("")),
});

export default function AdminEditProfileDialog({ isOpen, onClose, userId }) {
  const { data, isLoading, isError } = useGetUserByIdQuery(userId, { skip: !isOpen || !userId });
  const [editUserProfile, { isLoading: isUpdating }] = useEditUserProfileMutation();

  const user = data;

  const form = useForm({
    resolver: zodResolver(adminEditProfileSchema),
    defaultValues: {
      name: "",
      username: "",
      email: "",
      age: "",
      gender: "",
    },
  });

  useEffect(() => {
    if (user) {
      form.reset({
        name: user.name || "",
        username: user.username || "",
        email: user.email || "",
        age: user.age != null ? String(user.age) : "",
        gender: user.gender ? user.gender.toLowerCase().trim() : "",
      });
    }
  }, [user, form]);

  const onSubmit = async (formData) => {
    if (!form.formState.isDirty) {
      onClose();
      return;
    }

    const dirtyFields = form.formState.dirtyFields;
    const changedFields = {};
    for (const key in dirtyFields) {
      if (dirtyFields[key]) {
        changedFields[key] = formData[key];
      }
    }

    if (Object.keys(changedFields).length === 0) {
      onClose();
      return;
    }

    try {
      await editUserProfile({ id: userId, profile: changedFields }).unwrap();
      toast.success("User profile updated successfully");
      onClose();
    } catch (err) {
      toast.error(err?.data?.message || err.message || "Failed to update profile");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit User Profile</DialogTitle>
          <DialogDescription>
            Make changes to the user's basic profile details.
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex justify-center p-6">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : isError ? (
          <div className="p-6 text-center text-red-500">Failed to load user details.</div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Display Name</FormLabel>
                    <FormControl>
                      <Input placeholder="User's name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Username</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <span className="absolute left-3 top-2.5 text-muted-foreground text-sm">@</span>
                        <Input className="pl-7" placeholder="username" {...field} />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email Address</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="user@example.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="age"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Age</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="e.g. 25" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="gender"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Gender</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select" />
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

              <div className="flex justify-end gap-3 pt-4 border-t">
                <Button type="button" variant="ghost" onClick={onClose} className="cursor-pointer">
                  Cancel
                </Button>
                <Button type="submit" disabled={isUpdating || !form.formState.isDirty} className="cursor-pointer">
                  {isUpdating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Save Changes
                </Button>
              </div>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  );
}

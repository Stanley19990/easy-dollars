"use client"

import { useState } from "react"
import { useAuth } from "@/hooks/use-auth"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { User, Mail, Phone, MapPin, Calendar, Edit3 } from "lucide-react"
import { toast } from "sonner"
import { supabase } from "@/lib/supabase"

interface ProfileModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ProfileModal({ open, onOpenChange }: ProfileModalProps) {
  const { user, refreshUser } = useAuth()
  const [editing, setEditing] = useState(false)
  const [profileData, setProfileData] = useState({
    fullName: user?.full_name || "",
    phone: user?.phone || "",
    country: user?.country || "",
  })
  const [saving, setSaving] = useState(false)

 const handleSave = async () => {
  if (!user) return;

  try {
    // Check if phone already exists
    const { data: existingUsers } = await supabase
      .from("users")
      .select("id")
      .eq("phone", profileData.phone)
      .neq("id", user.id)
      .limit(1);

    if (existingUsers && existingUsers.length > 0) {
      toast.error("This phone number is already in use.");
      return;
    }

    // Update user
    const { data, error } = await supabase
      .from("users")
      .update({
        full_name: profileData.fullName,
        phone: profileData.phone,
        country: profileData.country,
      })
      .eq("id", user.id)
      .select()
      .single();

    if (error) throw error;

    toast.success("Profile updated successfully!");
    refreshUser();
    setEditing(false);
  } catch (error: any) {
    console.error(error);
    toast.error(error.message || "Failed to update profile");
  }
};

  const handleCancel = () => {
    setProfileData({
      fullName: user?.full_name || "",
      phone: user?.phone || "",
      country: user?.country || "",
    })
    setEditing(false)
  }

  if (!user) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-slate-900 border-slate-800 text-white max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <User className="h-5 w-5 text-cyan-400" />
            <span>Profile Settings</span>
          </DialogTitle>
          <DialogDescription className="text-slate-400">View and manage your account information</DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Profile Avatar */}
          <div className="flex flex-col items-center space-y-4">
            <Avatar className="h-20 w-20 border-4 border-cyan-500/20">
              <AvatarFallback className="bg-gradient-to-r from-cyan-500 to-blue-500 text-white text-2xl">
                {user.full_name?.charAt(0) || "U"}
              </AvatarFallback>
            </Avatar>
            <div className="text-center">
              <h3 className="font-semibold text-lg">{user.full_name || "User"}</h3>
              <p className="text-slate-400 text-sm">{user.email}</p>
            </div>
          </div>

          {/* Profile Information */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fullName" className="flex items-center space-x-2">
                <User className="h-4 w-4 text-cyan-400" />
                <span>Full Name</span>
              </Label>
              <Input
                id="fullName"
                value={profileData.fullName}
                onChange={(e) => setProfileData({ ...profileData, fullName: e.target.value })}
                disabled={!editing || saving}
                className="bg-slate-800 border-slate-700 focus:border-cyan-500 disabled:opacity-60"
              />
            </div>

            <div className="space-y-2">
              <Label className="flex items-center space-x-2">
                <Mail className="h-4 w-4 text-cyan-400" />
                <span>Email</span>
              </Label>
              <Input value={user.email} disabled className="bg-slate-800 border-slate-700 opacity-60" />
              <p className="text-xs text-slate-400">Email cannot be changed</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone" className="flex items-center space-x-2">
                <Phone className="h-4 w-4 text-cyan-400" />
                <span>Phone</span>
              </Label>
              <Input
                id="phone"
                value={profileData.phone}
                onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                disabled={!editing || saving}
                className="bg-slate-800 border-slate-700 focus:border-cyan-500 disabled:opacity-60"
                placeholder="Enter phone number"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="country" className="flex items-center space-x-2">
                <MapPin className="h-4 w-4 text-cyan-400" />
                <span>Country</span>
              </Label>
              <Input
                id="country"
                value={profileData.country}
                onChange={(e) => setProfileData({ ...profileData, country: e.target.value })}
                disabled={!editing || saving}
                className="bg-slate-800 border-slate-700 focus:border-cyan-500 disabled:opacity-60"
                placeholder="Enter country"
              />
            </div>

            <div className="space-y-2">
              <Label className="flex items-center space-x-2">
                <Calendar className="h-4 w-4 text-cyan-400" />
                <span>Member Since</span>
              </Label>
              <Input
                value={new Date(user.created_at || Date.now()).toLocaleDateString()}
                disabled
                className="bg-slate-800 border-slate-700 opacity-60"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-2">
            {editing ? (
              <>
                <Button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex-1 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600"
                >
                  Save Changes
                </Button>
                <Button
                  onClick={handleCancel}
                  variant="outline"
                  disabled={saving}
                  className="flex-1 border-slate-700 text-slate-400 hover:text-white bg-transparent"
                >
                  Cancel
                </Button>
              </>
            ) : (
              <Button
                onClick={() => setEditing(true)}
                className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
              >
                <Edit3 className="h-4 w-4 mr-2" />
                Edit Profile
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

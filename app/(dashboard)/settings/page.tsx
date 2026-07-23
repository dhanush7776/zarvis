"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { useUser } from "@/hooks/useUser";
import { useSettings } from "@/hooks/useSettings";
import { useToast } from "@/components/ui/toast";

const LANGUAGES = [
  { value: "en", label: "English" },
  { value: "es", label: "Spanish" },
  { value: "fr", label: "French" },
  { value: "de", label: "German" },
  { value: "hi", label: "Hindi" },
  { value: "te", label: "Telugu" },
];

export default function SettingsPage() {
  const { user, signOut } = useUser();
  const { settings, isLoading, updateSettings } = useSettings(user?.id);
  const { toast } = useToast();
  const router = useRouter();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDeleteAccount = async () => {
    setIsDeleting(true);
    const res = await fetch("/api/account", { method: "DELETE" });
    if (res.ok) {
      await signOut();
      router.push("/");
    } else {
      const data = await res.json();
      toast({ title: "Couldn't delete account", description: data.error, variant: "error" });
      setIsDeleting(false);
    }
  };

  if (isLoading || !settings) {
    return <div className="p-6 text-muted-foreground">Loading settings…</div>;
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-6">
      <div>
        <h1 className="font-display text-2xl font-semibold">Settings</h1>
        <p className="text-sm text-muted-foreground">Tune how Zarvis looks, sounds, and listens.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Appearance</CardTitle>
          <CardDescription>Theme and language preferences.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label>Theme</Label>
            <Select value={settings.theme} onValueChange={(v) => updateSettings({ theme: v })}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="dark">Dark</SelectItem>
                <SelectItem value="light">Light</SelectItem>
                <SelectItem value="system">System</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center justify-between">
            <Label>Language</Label>
            <Select value={settings.language} onValueChange={(v) => updateSettings({ language: v })}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {LANGUAGES.map((l) => (
                  <SelectItem key={l.value} value={l.value}>
                    {l.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Voice & wake mode</CardTitle>
          <CardDescription>Control how Zarvis listens and speaks.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <Label>Wake mode</Label>
              <p className="text-xs text-muted-foreground">Listen ambiently for your wake word.</p>
            </div>
            <Switch
              checked={settings.wake_mode_enabled}
              onCheckedChange={(v) => updateSettings({ wake_mode_enabled: v })}
            />
          </div>

          <div className="space-y-1.5">
            <Label>Wake word</Label>
            <Input
              defaultValue={settings.wake_word}
              onBlur={(e) => updateSettings({ wake_word: e.target.value.toLowerCase() })}
              placeholder="hey zarvis"
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label>Double-clap activation</Label>
              <p className="text-xs text-muted-foreground">Clap twice quickly to activate Zarvis.</p>
            </div>
            <Switch
              checked={settings.clap_detection_enabled}
              onCheckedChange={(v) => updateSettings({ clap_detection_enabled: v })}
            />
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label>Clap sensitivity</Label>
              <span className="text-xs text-muted-foreground">{settings.clap_sensitivity}/10</span>
            </div>
            <Slider
              min={1}
              max={10}
              step={1}
              value={[settings.clap_sensitivity]}
              onValueChange={([v]) => updateSettings({ clap_sensitivity: v })}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Notifications</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <Label>Enable notifications</Label>
            <Switch
              checked={settings.notifications_enabled}
              onCheckedChange={(v) => updateSettings({ notifications_enabled: v })}
            />
          </div>
        </CardContent>
      </Card>

      <Card className="border-rose-500/20">
        <CardHeader>
          <CardTitle className="text-rose-400">Danger zone</CardTitle>
          <CardDescription>Permanently delete your account and all associated data.</CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="destructive" className="gap-2" onClick={() => setConfirmOpen(true)}>
            <Trash2 className="h-4 w-4" /> Delete account
          </Button>
        </CardContent>
      </Card>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete your account?</DialogTitle>
            <DialogDescription>
              This permanently deletes your profile, conversations, documents, images, and memories. This
              cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteAccount} disabled={isDeleting}>
              {isDeleting && <Loader2 className="h-4 w-4 animate-spin" />}
              Yes, delete everything
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

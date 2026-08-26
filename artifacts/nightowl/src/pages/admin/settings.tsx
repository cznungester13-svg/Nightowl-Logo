import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { 
  useGetAdminSiteSettings, 
  useUpdateAdminSiteSettings
} from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import { Save, Loader2 } from "lucide-react";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

const settingsSchema = z.object({
  heroTitle: z.string().min(3).max(80),
  heroAccent: z.string().min(3).max(80),
  heroDescription: z.string().min(10).max(300),
  monthlyPrice: z.coerce.number().min(0).max(10000),
  pricingBadge: z.string().min(2).max(80),
  contactEmail: z.string().email().max(255),
});

export function AdminSettingsPage() {
  const { data: settings, isLoading } = useGetAdminSiteSettings();
  const updateSettings = useUpdateAdminSiteSettings();
  const { toast } = useToast();

  const form = useForm<z.infer<typeof settingsSchema>>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      heroTitle: "",
      heroAccent: "",
      heroDescription: "",
      monthlyPrice: 0,
      pricingBadge: "",
      contactEmail: "",
    },
  });

  useEffect(() => {
    if (settings) {
      form.reset({
        heroTitle: settings.heroTitle,
        heroAccent: settings.heroAccent,
        heroDescription: settings.heroDescription,
        monthlyPrice: settings.monthlyPrice,
        pricingBadge: settings.pricingBadge,
        contactEmail: settings.contactEmail,
      });
    }
  }, [settings, form]);

  const onSubmit = (values: z.infer<typeof settingsSchema>) => {
    updateSettings.mutate(
      { data: values },
      {
        onSuccess: () => {
          toast({
            title: "Settings saved",
            description: "Your landing page has been updated.",
          });
        },
        onError: () => {
          toast({
            title: "Failed to save settings",
            description: "Please check your inputs and try again.",
            variant: "destructive",
          });
        },
      }
    );
  };

  if (isLoading) {
    return (
      <div className="space-y-8 animate-pulse max-w-2xl">
        <div className="h-8 w-48 bg-card rounded" />
        <div className="space-y-6">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="h-16 bg-card rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl">
      <div className="mb-8">
        <h1 className="font-display text-3xl font-semibold tracking-tight">Marketing Settings</h1>
        <p className="mt-2 text-sm text-muted-foreground">Control the public face of NightOwl.</p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <div className="rounded-3xl border border-border bg-card p-8 space-y-6">
            <div className="mb-4">
              <h2 className="font-display text-lg font-semibold">Hero Section</h2>
              <p className="text-xs text-muted-foreground">The first thing visitors see.</p>
            </div>

            <FormField
              control={form.control}
              name="heroTitle"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Primary Title</FormLabel>
                  <FormControl>
                    <Input {...field} className="bg-background border-border" data-testid="input-hero-title" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="heroAccent"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Accent Text</FormLabel>
                  <FormControl>
                    <Input {...field} className="bg-background border-border text-primary" data-testid="input-hero-accent" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="heroDescription"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Description</FormLabel>
                  <FormControl>
                    <Textarea {...field} rows={3} className="bg-background border-border resize-none" data-testid="input-hero-description" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="rounded-3xl border border-border bg-card p-8 space-y-6">
            <div className="mb-4">
              <h2 className="font-display text-lg font-semibold">Pricing & Contact</h2>
              <p className="text-xs text-muted-foreground">Configuration for the lower sections.</p>
            </div>

            <div className="grid sm:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="monthlyPrice"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Monthly Price ($)</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} className="bg-background border-border" data-testid="input-monthly-price" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="pricingBadge"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Pricing Badge</FormLabel>
                    <FormControl>
                      <Input {...field} className="bg-background border-border" data-testid="input-pricing-badge" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="contactEmail"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Contact Email</FormLabel>
                  <FormControl>
                    <Input type="email" {...field} className="bg-background border-border" data-testid="input-contact-email" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={updateSettings.isPending || !form.formState.isDirty}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-8 py-3 text-sm font-bold text-primary-foreground transition-all hover:bg-primary/90 disabled:opacity-50 disabled:pointer-events-none"
              data-testid="button-save-settings"
            >
              {updateSettings.isPending ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <Save size={18} />
              )}
              Save Changes
            </button>
          </div>
        </form>
      </Form>
    </div>
  );
}

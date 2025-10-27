"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BUSINESS_CATEGORIES, LANGUAGES, TIMEZONES } from "@/types/onboarding";

const FormSchema = z.object({
  business_name: z.string().min(1, "Business name is required"),
  business_category: z.string().min(1, "Please select a business category"),
  default_language: z.string().min(1, "Please select a language"),
  timezone: z.string().min(1, "Please select a timezone"),
  use_business_hours: z.boolean().optional(),
});

interface BusinessInfoStepProps {
  onNext: (data: z.infer<typeof FormSchema>) => void;
  onSkip: () => void;
  onBack: () => void;
  initialData?: Partial<z.infer<typeof FormSchema>>;
  isLoading?: boolean;
}

function BusinessInfoForm({
  form,
  onSubmit,
  onBack,
  onSkip,
  isLoading,
}: {
  form: ReturnType<typeof useForm<z.infer<typeof FormSchema>>>;
  onSubmit: (data: z.infer<typeof FormSchema>) => void;
  onBack: () => void;
  onSkip: () => void;
  isLoading?: boolean;
}) {
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="business_name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Business Name</FormLabel>
              <FormControl>
                <Input placeholder="Your Business Name" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="business_category"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Business Category</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select your business category" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {BUSINESS_CATEGORIES.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="default_language"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Default Language</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select language" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {LANGUAGES.map((language) => (
                    <SelectItem key={language} value={language}>
                      {language}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="timezone"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Time Zone</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select timezone" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {TIMEZONES.map((tz) => (
                    <SelectItem key={tz} value={tz}>
                      {tz.replace("_", " ")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="use_business_hours"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center space-y-0 space-x-3">
              <FormControl>
                <Checkbox checked={field.value} onCheckedChange={field.onChange} />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel>Use business hours (9 AM – 6 PM)</FormLabel>
              </div>
            </FormItem>
          )}
        />

        <div className="flex gap-3 pt-4">
          <Button type="button" variant="outline" onClick={onBack}>
            Back
          </Button>
          <Button type="submit" className="flex-1" disabled={isLoading}>
            {isLoading ? (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
            ) : (
              "Continue"
            )}
          </Button>
          <Button type="button" variant="outline" onClick={onSkip}>
            Skip
          </Button>
        </div>
      </form>
    </Form>
  );
}

function BusinessInfoHeader() {
  return (
    <div className="space-y-2 text-left">
      <h1 className="text-2xl font-medium">Business & User Info</h1>
      <p className="text-muted-foreground text-sm">Personalize your assistant and tie calls to your business.</p>
    </div>
  );
}

function getDefaultValues(initialData?: Partial<z.infer<typeof FormSchema>>) {
  const data = initialData ?? {};
  return {
    business_name: data.business_name ?? "",
    business_category: data.business_category ?? "",
    default_language: data.default_language ?? "English",
    timezone: data.timezone ?? "America/New_York",
    use_business_hours: data.use_business_hours ?? false,
  };
}

function useBusinessInfoForm(initialData?: Partial<z.infer<typeof FormSchema>>) {
  return useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: getDefaultValues(initialData),
  });
}

export function BusinessInfoStep({ onNext, onSkip, onBack, initialData, isLoading }: BusinessInfoStepProps) {
  const form = useBusinessInfoForm(initialData);
  const onSubmit = (data: z.infer<typeof FormSchema>) => onNext(data);

  return (
    <div className="mx-auto flex w-full flex-col justify-center space-y-8 sm:w-[400px]">
      <BusinessInfoHeader />
      <BusinessInfoForm form={form} onSubmit={onSubmit} onBack={onBack} onSkip={onSkip} isLoading={isLoading} />
    </div>
  );
}

"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BUSINESS_TYPES, LANGUAGES } from "@/types/agents";

const FormSchema = z.object({
  name: z.string().min(1, "Assistant name is required"),
  business_type: z.enum(["cleaning", "real_estate", "clinic", "agency", "general"]),
  language: z.enum(["english", "arabic", "both"]),
});

export type BasicsFormData = z.infer<typeof FormSchema>;

interface BasicsStepProps {
  onNext: (data: BasicsFormData) => void;
  initialData?: Partial<BasicsFormData>;
  isLoading?: boolean;
}

export function BasicsStep({ onNext, initialData, isLoading }: BasicsStepProps) {
  const form = useForm<BasicsFormData>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      name: initialData?.name ?? "Receptionist",
      business_type: initialData?.business_type ?? "general",
      language: initialData?.language ?? "english",
    },
  });

  const onSubmit = (data: BasicsFormData) => {
    onNext(data);
  };

  return (
    <div className="mx-auto flex w-full flex-col justify-center space-y-8 sm:w-[500px]">
      <div className="space-y-2 text-left">
        <h1 className="text-2xl font-medium">Let&apos;s create your AI Assistant</h1>
        <p className="text-muted-foreground text-sm">Start by telling us about your assistant and business needs.</p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>What should we call your assistant?</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., Receptionist, Sarah, Alex" {...field} />
                </FormControl>
                <FormDescription>This name will be used to identify your assistant.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="business_type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Business Type</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select your business type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {BUSINESS_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormDescription>This helps us generate the right default prompts and settings.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="language"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Language</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select language" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {LANGUAGES.map((lang) => (
                      <SelectItem key={lang.value} value={lang.value}>
                        {lang.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormDescription>Choose the language your assistant will use.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="flex gap-3 pt-4">
            <Button type="submit" className="flex-1" disabled={isLoading}>
              {isLoading ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
              ) : (
                "Continue"
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}


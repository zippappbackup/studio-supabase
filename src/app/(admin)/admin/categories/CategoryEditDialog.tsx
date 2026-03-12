"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useForm, useFieldArray, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { supabase } from "@/lib/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Trash2, PlusCircle, Loader2 } from "lucide-react";
import type { Category, FieldSchema } from "@/lib/types";

// Master list of all possible modules in the entire system
const MODULES_MASTER_LIST = [
  "promotions", "products", "bookings", "listings", "reviews", "services", "orders"
];

const fieldSchema = z.object({
  key: z.string().min(1, "Key is required").regex(/^[a-zA-Z0-9_]+$/, "Key must be alphanumeric with no spaces."),
  label: z.string().min(1, "Label is required"),
  type: z.enum(["string", "number", "boolean", "date", "select"]),
  required: z.boolean(),
  uiComponent: z.enum(["text", "textarea", "select", "switch", "file"]),
});

const categorySchema = z.object({
  name: z.string().min(2, "Category name is required"),
  description: z.string().optional(),
  iconUrl: z.string().optional(),
  defaultModules: z.array(z.string()).optional(),
  fieldsSchema: z.array(fieldSchema).optional(),
});

type CategoryFormData = z.infer<typeof categorySchema>;

interface CategoryEditDialogProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  category?: Category;
  logMessage: (message: string) => void;
}

export function CategoryEditDialog({
  isOpen,
  setIsOpen,
  category,
  logMessage,
}: CategoryEditDialogProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<CategoryFormData>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      name: "",
      description: "",
      iconUrl: "",
      defaultModules: [],
      fieldsSchema: [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "fieldsSchema",
  });

  useEffect(() => {
    if (isOpen) {
        if (category) {
          logMessage(`Opened dialog to edit category: "${category.name}"`);
          reset({
            name: category.name,
            description: category.description || "",
            iconUrl: category.iconUrl || "",
            defaultModules: category.defaultModules,
            fieldsSchema: category.fieldsSchema as FieldSchema[] | undefined,
          });
        } else {
          logMessage("Opened dialog to create a new category.");
          reset({
            name: "",
            description: "",
            iconUrl: "",
            defaultModules: [],
            fieldsSchema: [],
          });
        }
    }
  }, [category, reset, isOpen, logMessage]);

  const onSubmit = async (data: CategoryFormData) => {
    setIsLoading(true);
    const action = category ? 'Updating' : 'Creating';
    logMessage(`${action} category: "${data.name}"`);

    try {
      if (category) {
        // UPDATE existing category
        const finalData = {
          name: data.name,
          description: data.description || "",
          icon_url: data.iconUrl || "",
          default_modules: data.defaultModules || [],
          fields_schema: data.fieldsSchema || [],
          modules_available: MODULES_MASTER_LIST,
          updated_at: new Date().toISOString(),
        };
        
        const { error } = await supabase
          .from('categories')
          .update(finalData)
          .eq('id', category.id);
        
        if (error) throw error;
        
        const successMsg = `Category "${data.name}" has been updated.`;
        toast({ title: "Category Updated", description: successMsg, variant: "success" });
        logMessage(`Success: ${successMsg}`);
      } else {
        // CREATE new category
        const docId = data.name.toLowerCase().replace(/\s+/g, '-');
        const finalData = {
          id: docId,
          name: data.name,
          description: data.description || "",
          icon_url: data.iconUrl || "",
          default_modules: data.defaultModules || [],
          fields_schema: data.fieldsSchema || [],
          modules_available: MODULES_MASTER_LIST,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        
        const { error } = await supabase
          .from('categories')
          .insert(finalData);
        
        if (error) throw error;
        
        const successMsg = `A new category "${data.name}" has been created with ID: ${docId}.`;
        toast({ title: "Category Created", description: successMsg, variant: "success" });
        logMessage(`Success: ${successMsg}`);
      }
    } catch(e: any) {
        const errorMsg = `Error: ${e.message}`;
        toast({ title: `${action} Failed`, description: errorMsg, variant: "destructive" });
        logMessage(errorMsg);
    } finally {
        setIsLoading(false);
        setIsOpen(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>
            {category ? "Edit Category" : "Create New Category"}
          </DialogTitle>
          <DialogDescription>
            Configure the category name, modules, and custom fields for vendors.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 max-h-[70vh] overflow-y-auto pr-4">
          {/* Basic Info */}
          <div className="space-y-4 rounded-md border p-4">
            <h3 className="font-semibold text-lg">Basic Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Category Name</Label>
                  <Input id="name" {...register("name")} placeholder="e.g., F&B, Retail, Services"/>
                  {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="iconUrl">Icon URL (Optional)</Label>
                  <Input id="iconUrl" {...register("iconUrl")} placeholder="https://example.com/icon.png"/>
                </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" {...register("description")} placeholder="A brief summary of what this category includes."/>
            </div>
          </div>
          
          {/* Default Modules */}
          <div className="space-y-3 rounded-md border p-4">
            <Label className="font-semibold text-lg">Default Modules</Label>
            <p className="text-sm text-muted-foreground">Select the modules that vendors in this category will have enabled by default.</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-x-4 gap-y-2 pt-2">
              {MODULES_MASTER_LIST.map(moduleName => (
                <Controller
                    key={moduleName}
                    name="defaultModules"
                    control={control}
                    render={({ field }) => {
                        return (
                            <div className="flex items-center gap-2">
                                <Switch
                                    id={`module-${moduleName}`}
                                    checked={field.value?.includes(moduleName)}
                                    onCheckedChange={(checked) => {
                                        return checked
                                            ? field.onChange([...(field.value || []), moduleName])
                                            : field.onChange(field.value?.filter((value) => value !== moduleName));
                                    }}
                                />
                                <Label htmlFor={`module-${moduleName}`} className="capitalize font-normal text-sm">{moduleName}</Label>
                            </div>
                        );
                    }}
                />

              ))}
            </div>
          </div>

          {/* Fields Schema */}
          <div className="space-y-4 rounded-md border p-4">
            <div className="flex items-center justify-between">
                <div className="space-y-1">
                    <h3 className="text-lg font-semibold">Custom Fields Schema</h3>
                    <p className="text-sm text-muted-foreground">Define custom data fields for vendors registering under this category.</p>
                </div>
                <Button type="button" variant="outline" size="sm" onClick={() => append({ key: "", label: "", type: "string", required: false, uiComponent: "text"})}>
                    <PlusCircle className="mr-2 h-4 w-4" /> Add Field
                </Button>
            </div>
            {fields.map((item, index) => (
              <div key={item.id} className="grid grid-cols-12 gap-x-3 gap-y-2 rounded-md border p-3 relative bg-background/50">
                 <div className="col-span-12 sm:col-span-6 md:col-span-3 space-y-1">
                    <Label className="text-xs">Field Key</Label>
                    <Input {...register(`fieldsSchema.${index}.key`)} placeholder="e.g., menu_url" />
                    {errors.fieldsSchema?.[index]?.key && <p className="text-sm text-destructive">{errors.fieldsSchema[index]?.key?.message}</p>}
                 </div>
                 <div className="col-span-12 sm:col-span-6 md:col-span-3 space-y-1">
                    <Label className="text-xs">Display Label</Label>
                    <Input {...register(`fieldsSchema.${index}.label`)} placeholder="e.g., Menu URL" />
                 </div>
                 <div className="col-span-6 md:col-span-2 space-y-1">
                    <Label className="text-xs">Data Type</Label>
                     <Controller
                        name={`fieldsSchema.${index}.type`}
                        control={control}
                        render={({ field }) => (
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <SelectTrigger><SelectValue/></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="string">String</SelectItem>
                                    <SelectItem value="number">Number</SelectItem>
                                    <SelectItem value="boolean">Boolean</SelectItem>
                                    <SelectItem value="date">Date</SelectItem>
                                    <SelectItem value="select">Select</SelectItem>
                                </SelectContent>
                            </Select>
                        )}
                     />
                 </div>
                 <div className="col-span-6 md:col-span-2 space-y-1">
                    <Label className="text-xs">UI Component</Label>
                    <Controller
                        name={`fieldsSchema.${index}.uiComponent`}
                        control={control}
                        render={({ field }) => (
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <SelectTrigger><SelectValue/></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="text">Text</SelectItem>
                                    <SelectItem value="textarea">Textarea</SelectItem>
                                    <SelectItem value="switch">Switch</SelectItem>
                                    <SelectItem value="select">Select</SelectItem>
                                    <SelectItem value="file">File</SelectItem>
                                </SelectContent>
                            </Select>
                        )}
                    />
                 </div>
                 <div className="col-span-6 md:col-span-1 flex items-center justify-center pt-5">
                    <div className="flex items-center gap-2">
                        <Label className="text-xs">Required</Label>
                        <Switch {...register(`fieldsSchema.${index}.required`)} />
                    </div>
                 </div>
                 <div className="col-span-6 md:col-span-1 flex items-center justify-center pt-3">
                    <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)} className="text-muted-foreground hover:text-destructive hover:bg-destructive/10">
                        <Trash2 className="h-4 w-4"/>
                    </Button>
                 </div>
              </div>
            ))}
            {fields.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">No custom fields defined.</p>}
          </div>

          <DialogFooter className="pt-4">
            <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                Save Category
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

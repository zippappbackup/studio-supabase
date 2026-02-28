
"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { PlusCircle } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useCollection, useMemoFirebase } from "@/firebase";
import { collection, query } from "firebase/firestore";
import { useFirestore } from "@/firebase";
import { Category } from "@/lib/types";
import { CategoryEditDialog } from "./CategoryEditDialog";
import { CategoryActions } from "./CategoryActions";

export default function CategoriesPage() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const db = useFirestore();
  const categoriesQuery = useMemoFirebase(() => db ? query(collection(db, "categories")) : null, [db]);
  const { data: categories, isLoading } = useCollection<Category>(categoriesQuery);
  const [logs, setLogs] = useState<string[]>([]);
  
  // The logMessage function is kept to avoid breaking child components that require it.
  const logMessage = useCallback((message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    // The log is now only sent to the console, not displayed in the UI.
    console.log(`${timestamp}: ${message}`);
    setLogs(prev => [...prev, `${timestamp}: ${message}`]);
  }, []);

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center justify-between">
        <div>
            <h1 className="text-3xl font-bold tracking-tight">Category Manager</h1>
            <p className="text-muted-foreground">Configure and manage vendor categories and their associated modules.</p>
        </div>
        <Button onClick={() => {
          logMessage("Opened 'Add Category' dialog.");
          setIsCreateDialogOpen(true);
        }}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Add Category
        </Button>
      </div>

      <Card>
          <CardHeader>
          <CardTitle>Categories</CardTitle>
          <CardDescription>A list of all available categories in the system.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="relative w-full overflow-x-auto">
              <Table>
                <TableHeader>
                    <TableRow>
                    <TableHead className="w-[150px]">Name</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Default Modules</TableHead>
                    <TableHead className="text-center">Custom Fields</TableHead>
                    <TableHead><span className="sr-only">Actions</span></TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {isLoading && (
                    <TableRow>
                        <TableCell colSpan={5} className="text-center h-24">Loading categories...</TableCell>
                    </TableRow>
                    )}
                    {!isLoading && categories?.length === 0 && (
                    <TableRow>
                        <TableCell colSpan={5} className="text-center h-24">No categories found. Create one to get started.</TableCell>
                    </TableRow>
                    )}
                    {categories?.map((category) => (
                    <TableRow key={category.id}>
                        <TableCell className="font-medium">{category.name}</TableCell>
                        <TableCell className="text-muted-foreground max-w-xs truncate">{category.description}</TableCell>
                        <TableCell>
                        <div className="flex flex-wrap gap-1">
                            {category.defaultModules?.map(m => <Badge key={m} variant="secondary" className="capitalize">{m}</Badge>)}
                        </div>
                        </TableCell>
                        <TableCell className="text-center">{category.fieldsSchema?.length || 0}</TableCell>
                        <TableCell className="text-right">
                        <CategoryActions category={category} logMessage={logMessage} />
                        </TableCell>
                    </TableRow>
                    ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
      </Card>

      <CategoryEditDialog
        isOpen={isCreateDialogOpen}
        setIsOpen={setIsCreateDialogOpen}
        logMessage={logMessage}
      />
    </div>
  );
}

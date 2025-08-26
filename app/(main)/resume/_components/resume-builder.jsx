"use client";

import { useState, useEffect, useMemo } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  AlertTriangle,
  Download,
  Edit,
  Loader2,
  Monitor,
  Save,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { saveResume } from "@/actions/resume";
import { EntryForm } from "./entry-form";
import useFetch from "@/hooks/use-fetch";
import { useUser } from "@clerk/nextjs";
import { entriesToMarkdown } from "@/app/lib/helper";
import { resumeSchema } from "@/app/lib/schema";
import html2pdf from "html2pdf.js/dist/html2pdf.min.js";
import dynamic from "next/dynamic";

// Lazy load heavy markdown editor with better error handling
const MDEditor = dynamic(() => import("@uiw/react-md-editor"), { 
  ssr: false,
  loading: () => <div className="h-32 bg-muted animate-pulse rounded flex items-center justify-center">
    <span className="text-muted-foreground">Loading editor...</span>
  </div>,
  onError: (error) => {
    console.error("Failed to load MDEditor:", error);
    return <div className="h-32 bg-red-50 border border-red-200 rounded flex items-center justify-center">
      <span className="text-red-600">Failed to load editor</span>
    </div>;
  }
});

export default function ResumeBuilder({ initialContent }) {
  const [activeTab, setActiveTab] = useState("edit");
  const [previewContent, setPreviewContent] = useState(initialContent || "");
  const { user } = useUser();
  const [resumeMode, setResumeMode] = useState("preview");
  const [editorLoaded, setEditorLoaded] = useState(false);

  const {
    control,
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(resumeSchema),
    defaultValues: {
      contactInfo: {},
      summary: "",
      skills: "",
      experience: [],
      education: [],
      projects: [],
    },
  });

  const {
    loading: isSaving,
    fn: saveResumeFn,
    data: saveResult,
    error: saveError,
  } = useFetch(saveResume);

  // Watch form fields for preview updates
  const formValues = watch();

  useEffect(() => {
    if (initialContent) {
      setActiveTab("preview");
      setPreviewContent(initialContent);
    }
    // Mark editor as loaded after component mounts
    setEditorLoaded(true);
  }, [initialContent]);

  // Memoize contact markdown generation
  const getContactMarkdown = useMemo(() => {
    const { contactInfo } = formValues;
    const parts = [];
    if (contactInfo.email) parts.push(`📧 ${contactInfo.email}`);
    if (contactInfo.mobile) parts.push(`📱 ${contactInfo.mobile}`);
    if (contactInfo.linkedin)
      parts.push(`💼 [LinkedIn](${contactInfo.linkedin})`);
    if (contactInfo.twitter) parts.push(`🐦 [Twitter](${contactInfo.twitter})`);

    return parts.length > 0
      ? `## <div align="center">${user?.fullName || 'Your Name'}</div>
        \n\n<div align="center">\n\n${parts.join(" | ")}\n\n</div>`
      : "";
  }, [formValues.contactInfo, user?.fullName]);

  // Memoize combined content generation
  const getCombinedContent = useMemo(() => {
    const { summary, skills, experience, education, projects } = formValues;
    return [
      getContactMarkdown,
      summary && `## Professional Summary\n\n${summary}`,
      skills && `## Skills\n\n${skills}`,
      entriesToMarkdown(experience, "Work Experience"),
      entriesToMarkdown(education, "Education"),
      entriesToMarkdown(projects, "Projects"),
    ]
      .filter(Boolean)
      .join("\n\n");
  }, [formValues, getContactMarkdown]);

  const onSubmit = async (data) => {
    try {
      const result = await saveResumeFn({
        content: getCombinedContent,
        ...data,
      });
      if (result) {
        toast.success("Resume saved successfully!");
        setPreviewContent(getCombinedContent);
        setActiveTab("preview");
      }
    } catch (error) {
      toast.error("Failed to save resume");
    }
  };

  const handleDownload = () => {
    const element = document.getElementById("resume-pdf");
    if (element) {
      const opt = {
        margin: 1,
        filename: "resume.pdf",
        image: { type: "jpeg", quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { unit: "in", format: "letter", orientation: "portrait" },
      };
      html2pdf().set(opt).from(element).save();
    }
  };

  // Safety check for component rendering
  if (!editorLoaded) {
    return (
      <div className="space-y-6">
        <div className="text-center py-12">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <h2 className="text-xl font-semibold">Loading Resume Builder...</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Resume Builder</h1>
        <div className="flex gap-2">
          <Button onClick={handleDownload} variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Download PDF
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="edit">Edit Resume</TabsTrigger>
          <TabsTrigger value="preview">Preview</TabsTrigger>
        </TabsList>

        <TabsContent value="edit">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Contact Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Contact Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Email</label>
                  <Input
                    {...register("contactInfo.email")}
                    placeholder="your.email@example.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Mobile</label>
                  <Input
                    {...register("contactInfo.mobile")}
                    placeholder="+1 (555) 123-4567"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">LinkedIn</label>
                  <Input
                    {...register("contactInfo.linkedin")}
                    placeholder="https://linkedin.com/in/yourprofile"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Twitter</label>
                  <Input
                    {...register("contactInfo.twitter")}
                    placeholder="https://twitter.com/yourhandle"
                  />
                </div>
              </div>
            </div>

            {/* Summary */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Professional Summary</h3>
              <Textarea
                {...register("summary")}
                placeholder="Write a compelling summary of your professional background..."
                rows={4}
              />
              {errors.summary && (
                <p className="text-sm text-red-500">
                  {errors.summary.message}
                </p>
              )}
            </div>

            {/* Skills */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Skills</h3>
              <Textarea
                {...register("skills")}
                placeholder="List your key skills and competencies..."
                rows={3}
              />
              {errors.skills && (
                <p className="text-sm text-red-500">
                  {errors.skills.message}
                </p>
              )}
            </div>

            {/* Experience */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Work Experience</h3>
              <Controller
                name="experience"
                control={control}
                render={({ field }) => (
                  <EntryForm
                    type="Experience"
                    entries={field.value}
                    onChange={field.onChange}
                  />
                )}
              />
              {errors.experience && (
                <p className="text-sm text-red-500">
                  {errors.experience.message}
                </p>
              )}
            </div>

            {/* Education */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Education</h3>
              <Controller
                name="education"
                control={control}
                render={({ field }) => (
                  <EntryForm
                    type="Education"
                    entries={field.value}
                    onChange={field.onChange}
                  />
                )}
              />
              {errors.education && (
                <p className="text-sm text-red-500">
                  {errors.education.message}
                </p>
              )}
            </div>

            {/* Projects */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Projects</h3>
              <Controller
                name="projects"
                control={control}
                render={({ field }) => (
                  <EntryForm
                    type="Project"
                    entries={field.value}
                    onChange={field.onChange}
                  />
                )}
              />
              {errors.projects && (
                <p className="text-sm text-red-500">
                  {errors.projects.message}
                </p>
              )}
            </div>

            <Button type="submit" disabled={isSaving} className="w-full">
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Resume
                </>
              )}
            </Button>
          </form>
        </TabsContent>

        <TabsContent value="preview">
          {activeTab === "preview" && (
            <Button
              variant="link"
              type="button"
              className="mb-2"
              onClick={() =>
                setResumeMode(resumeMode === "preview" ? "edit" : "preview")
              }
            >
              {resumeMode === "preview" ? (
                <>
                  <Edit className="h-4 w-4" />
                  Edit Resume
                </>
              ) : (
                <>
                  <Monitor className="h-4 w-4" />
                  Show Preview
                </>
              )}
            </Button>
          )}

          {activeTab === "preview" && resumeMode !== "preview" && (
            <div className="flex p-3 gap-2 items-center border-2 border-yellow-600 text-yellow-600 rounded mb-2">
              <AlertTriangle className="h-5 w-5" />
              <span className="text-sm">
                You will lose edited markdown if you update the form data.
              </span>
            </div>
          )}
          
          <div className="border rounded-lg">
            {MDEditor ? (
              <MDEditor
                value={previewContent}
                onChange={setPreviewContent}
                height={800}
                preview={resumeMode}
              />
            ) : (
              <div className="h-32 bg-muted rounded flex items-center justify-center">
                <span className="text-muted-foreground">Editor loading...</span>
              </div>
            )}
          </div>
          
          <div className="hidden">
            <div id="resume-pdf">
              {MDEditor?.Markdown ? (
                <MDEditor.Markdown
                  source={previewContent}
                  style={{
                    background: "white",
                    color: "black",
                  }}
                />
              ) : (
                <div className="p-4">
                  <pre>{previewContent}</pre>
                </div>
              )}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

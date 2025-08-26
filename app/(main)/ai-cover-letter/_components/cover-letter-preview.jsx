"use client";

import React from "react";
import dynamic from "next/dynamic";

// Lazy load heavy markdown editor
const MDEditor = dynamic(() => import("@uiw/react-md-editor"), { 
  ssr: false,
  loading: () => <div className="h-32 bg-muted animate-pulse rounded" />
});

const CoverLetterPreview = ({ content }) => {
  return (
    <div className="py-4">
      <MDEditor value={content} preview="preview" height={700} />
    </div>
  );
};

export default CoverLetterPreview;

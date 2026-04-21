/**
 * Returns the grade letter, grade point, and color for a given percentage score.
 * Follows the University of Ilorin grading scale.
 */
export const gradeOf = (pct) => {
  if (pct >= 70) return { letter: "A", gp: 5.0, color: "#10B981" };
  if (pct >= 60) return { letter: "B", gp: 4.0, color: "#3B82F6" };
  if (pct >= 50) return { letter: "C", gp: 3.0, color: "#F59E0B" };
  if (pct >= 45) return { letter: "D", gp: 2.0, color: "#F97316" };
  if (pct >= 40) return { letter: "E", gp: 1.0, color: "#EF4444" };
  return { letter: "F", gp: 0.0, color: "#DC2626" };
};

/**
 * Validates a file before upload.
 * Returns an error string, or null if valid.
 */
export const validateFile = (file, allowedTypes, maxMB = 20) => {
  if (file.size > maxMB * 1024 * 1024) {
    return `File must be under ${maxMB}MB`;
  }
  const ext = file.name.split(".").pop().toLowerCase();
  const allowedExts = ["pdf", "doc", "docx", "ppt", "pptx", "mp4", "mov", "jpg", "jpeg", "png", "zip"];
  if (!allowedTypes.includes(file.type) && !allowedExts.includes(ext)) {
    return "File type not allowed. Please upload PDF, DOC, PPT, video, image, or ZIP.";
  }
  return null;
};

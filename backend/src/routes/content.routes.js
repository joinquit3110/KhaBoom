import express from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const router = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Root paths for content and translations
const contentRoot = path.resolve(process.cwd(), "../learned/textbooks-master/content");
const translationsRoot = path.resolve(process.cwd(), "../learned/textbooks-master/translations");

// Helper to read course metadata from Mathigon format
const readCourseMetadata = (courseId) => {
  try {
    // First try to get metadata from content.md (Mathigon style)
    const contentPath = path.join(contentRoot, courseId, "content.md");
    if (fs.existsSync(contentPath)) {
      const content = fs.readFileSync(contentPath, "utf8");
      const metadata = {};
      
      // Extract metadata from content using the Mathigon format (> key: value)
      const metadataRegex = /> ([\w-]+): (.+)/g;
      let match;
      while ((match = metadataRegex.exec(content)) !== null) {
        metadata[match[1]] = match[2];
      }
      
      // If we found metadata, use it
      if (Object.keys(metadata).length > 0) {
        return {
          id: courseId,
          title: metadata.title || courseId.charAt(0).toUpperCase() + courseId.slice(1).replace(/-/g, " "),
          description: metadata.description || `Learn about ${courseId.replace(/-/g, " ")}.`,
          level: metadata.level || "Intermediate",
          category: metadata.category || "Mathematics",
          color: metadata.color || ("#" + Math.floor(Math.random() * 16777215).toString(16)) // Random color if not specified
        };
      }
    }
    
    // Fall back to index.json if available
    const metadataPath = path.join(contentRoot, courseId, "index.json");
    if (fs.existsSync(metadataPath)) {
      const data = fs.readFileSync(metadataPath, "utf8");
      return JSON.parse(data);
    }
    
    // Default metadata if no files exist
    return {
      id: courseId,
      title: courseId.charAt(0).toUpperCase() + courseId.slice(1).replace(/-/g, " "),
      description: `Learn about ${courseId.replace(/-/g, " ")}.`,
      level: "Intermediate",
      category: "Mathematics",
      color: "#" + Math.floor(Math.random() * 16777215).toString(16) // Random color
    };
  } catch (error) {
    console.error(`Error reading metadata for ${courseId}:`, error);
    return null;
  }
};

// Helper to read content from a course directory (Mathigon format)
const readCourseContent = (courseId) => {
  try {
    const coursePath = path.join(contentRoot, courseId);
    if (!fs.existsSync(coursePath)) {
      return null;
    }

    // Check for main content.md file first (Mathigon structure)
    const mainContentPath = path.join(coursePath, "content.md");
    let mainContent = '';
    
    if (fs.existsSync(mainContentPath)) {
      mainContent = fs.readFileSync(mainContentPath, "utf8");
    }
    
    // Initialize sections array
    const sections = [];
    
    if (mainContent) {
      // Parse main content file into sections (Mathigon format)
      // Split by section markers (## Title followed by > section: id)
      const sectionMatches = mainContent.matchAll(/## ([^\n]+)\s*\n+> section: ([^\n]+)/g);
      let sectionPoints = [];
      
      // Collect all section starting points
      for (const match of sectionMatches) {
        sectionPoints.push({ 
          index: match.index, 
          title: match[1].trim(),
          id: match[2].trim()
        });
      }
      
      // Process each section
      for (let i = 0; i < sectionPoints.length; i++) {
        const current = sectionPoints[i];
        const next = sectionPoints[i + 1];
        const sectionContent = next ? 
          mainContent.substring(current.index, next.index) : 
          mainContent.substring(current.index);
        
        sections.push({
          id: current.id,
          title: current.title,
          content: sectionContent
        });
      }
    } else {
      // Fallback to directory scanning if no main content file
      // Get markdown files and subdirectories with content.md
      const files = fs.readdirSync(coursePath).filter(file => 
        file.endsWith(".md") || 
        (fs.statSync(path.join(coursePath, file)).isDirectory() && 
        fs.existsSync(path.join(coursePath, file, "content.md")))
      );
      
      // Process each file or directory
      files.forEach(file => {
        // Skip the main content.md file which we already processed
        if (file === "content.md") return;
        
        let content = '';
        let id = file.replace(".md", "");
        let title = id.charAt(0).toUpperCase() + id.slice(1).replace(/-/g, " ");
        
        if (file.endsWith(".md")) {
          content = fs.readFileSync(path.join(coursePath, file), "utf8");
        } else {
          const contentFilePath = path.join(coursePath, file, "content.md");
          if (fs.existsSync(contentFilePath)) {
            content = fs.readFileSync(contentFilePath, "utf8");
            
            // Try to extract title from metadata
            const titleMatch = content.match(/> title: (.+)/);
            if (titleMatch) {
              title = titleMatch[1];
            }
          }
        }
        
        // Skip if no content
        if (!content) return;
        
        sections.push({
          id,
          title,
          content
        });
      });
    }

    // Get course metadata
    const metadata = readCourseMetadata(courseId);
    
    // If we have no sections, try to create at least one from the entire content
    if (sections.length === 0 && mainContent) {
      sections.push({
        id: "introduction",
        title: "Introduction",
        content: mainContent
      });
    }
    
    return {
      course: metadata,
      content: {
        sections
      }
    };
  } catch (error) {
    console.error(`Error reading course content for ${courseId}:`, error);
    return null;
  }
};

// Helper to get available translations
const getTranslations = (courseId) => {
  try {
    const availableTranslations = [{ code: "en", name: "English" }];
    
    // Get all language directories from translations
    const translationsPath = path.join(translationsRoot);
    if (!fs.existsSync(translationsPath)) {
      return availableTranslations;
    }
    
    const langDirs = fs.readdirSync(translationsPath).filter(dir => 
      fs.statSync(path.join(translationsPath, dir)).isDirectory()
    );
    
    // For each language, check if it has content for this course
    langDirs.forEach(langCode => {
      const coursePath = path.join(translationsPath, langCode, courseId);
      if (fs.existsSync(coursePath)) {
        let langName = langCode;
        
        // Try to get language name from strings.yaml
        const stringsPath = path.join(translationsPath, "strings.yaml");
        if (fs.existsSync(stringsPath)) {
          const stringsContent = fs.readFileSync(stringsPath, "utf8");
          const langMatch = stringsContent.match(new RegExp(`${langCode}: (.+)`));
          if (langMatch) {
            langName = langMatch[1];
          }
        }
        
        // Language name mapping as fallback
        const langNames = {
          "ar": "Arabic",
          "cn": "Chinese",
          "de": "German",
          "es": "Spanish",
          "fr": "French",
          "hi": "Hindi",
          "hr": "Croatian",
          "it": "Italian",
          "ja": "Japanese",
          "pt": "Portuguese",
          "ro": "Romanian",
          "ru": "Russian",
          "sv": "Swedish",
          "tr": "Turkish",
          "vi": "Vietnamese"
        };
        
        if (langCode in langNames) {
          langName = langNames[langCode];
        }
        
        availableTranslations.push({
          code: langCode,
          name: langName
        });
      }
    });
    
    return availableTranslations;
  } catch (error) {
    console.error(`Error getting translations for ${courseId}:`, error);
    return [{ code: "en", name: "English" }];
  }
};

// Helper to get translated content
const getTranslatedContent = (courseId, langCode) => {
  try {
    // If English, just return the original content
    if (langCode === "en") {
      return readCourseContent(courseId);
    }
    
    const translationPath = path.join(translationsRoot, langCode, courseId);
    if (!fs.existsSync(translationPath)) {
      return readCourseContent(courseId);
    }
    
    // Start with the original content
    const originalContent = readCourseContent(courseId);
    if (!originalContent) {
      return null;
    }
    
    // Get all translated markdown files
    const files = fs.readdirSync(translationPath).filter(file => 
      file.endsWith(".md") || 
      (fs.statSync(path.join(translationPath, file)).isDirectory() && 
       fs.existsSync(path.join(translationPath, file, "content.md")))
    );
    
    // Create a map of section ID to translated content
    const translatedSections = {};
    files.forEach(file => {
      let content = '';
      let id = file.replace(".md", "");
      
      if (file.endsWith(".md")) {
        content = fs.readFileSync(path.join(translationPath, file), "utf8");
      } else {
        const contentFilePath = path.join(translationPath, file, "content.md");
        if (fs.existsSync(contentFilePath)) {
          content = fs.readFileSync(contentFilePath, "utf8");
        }
      }
      
      if (content) {
        translatedSections[id] = content;
      }
    });
    
    // Replace original content with translations where available
    const translatedContent = {
      ...originalContent,
      content: {
        ...originalContent.content,
        sections: originalContent.content.sections.map(section => {
          if (translatedSections[section.id]) {
            return {
              ...section,
              content: translatedSections[section.id]
            };
          }
          return section;
        })
      }
    };
    
    return translatedContent;
  } catch (error) {
    console.error(`Error getting translated content for ${courseId} in ${langCode}:`, error);
    return readCourseContent(courseId);
  }
};

// ROUTE: Check if content exists
router.head("/exists", (req, res) => {
  const { path: contentPath } = req.query;
  if (!contentPath) {
    return res.status(400).send();
  }
  
  const fullPath = path.join(contentRoot, contentPath);
  if (fs.existsSync(fullPath)) {
    return res.status(200).send();
  } else {
    return res.status(404).send();
  }
});

// ROUTE: Get list of available courses
router.get("/courses", (req, res) => {
  try {
    const courseDirs = fs.readdirSync(contentRoot).filter(dir => 
      fs.statSync(path.join(contentRoot, dir)).isDirectory()
    );
    
    const courses = courseDirs.map(courseId => {
      return readCourseMetadata(courseId);
    }).filter(Boolean);
    
    res.json(courses);
  } catch (error) {
    console.error("Error getting courses:", error);
    res.status(500).json({ error: "Failed to get courses" });
  }
});

// ROUTE: Get content for a specific course
router.get("/:courseId", (req, res) => {
  const { courseId } = req.params;
  const content = readCourseContent(courseId);
  
  if (!content) {
    return res.status(404).json({ error: "Course not found" });
  }
  
  res.json(content);
});

// ROUTE: Get available translations for a course
router.get("/translations/:courseId", (req, res) => {
  const { courseId } = req.params;
  const translations = getTranslations(courseId);
  res.json(translations);
});

// ROUTE: Get translated content for a course
router.get("/translations/:courseId/:langCode", (req, res) => {
  const { courseId, langCode } = req.params;
  const content = getTranslatedContent(courseId, langCode);
  
  if (!content) {
    return res.status(404).json({ error: "Course or translation not found" });
  }
  
  res.json(content);
});

export default router;

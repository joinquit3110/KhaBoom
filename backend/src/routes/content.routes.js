import express from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const router = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Root paths for content and translations
const contentRoot = path.resolve(process.cwd(), "../../content");
const translationsRoot = path.resolve(process.cwd(), "../../translations");

// Helper to read course metadata from index.json or config.yaml
const readCourseMetadata = (courseId) => {
  try {
    const metadataPath = path.join(contentRoot, courseId, "index.json");
    if (fs.existsSync(metadataPath)) {
      const data = fs.readFileSync(metadataPath, "utf8");
      return JSON.parse(data);
    } else {
      // Default metadata if file doesn't exist
      return {
        id: courseId,
        title: courseId.charAt(0).toUpperCase() + courseId.slice(1).replace(/-/g, " "),
        description: `Learn about ${courseId.replace(/-/g, " ")}.`,
        level: "Intermediate",
        category: "Mathematics",
        color: "#" + Math.floor(Math.random() * 16777215).toString(16) // Random color
      };
    }
  } catch (error) {
    console.error(`Error reading metadata for ${courseId}:`, error);
    return null;
  }
};

// Helper to read content from a course directory
const readCourseContent = (courseId) => {
  try {
    const coursePath = path.join(contentRoot, courseId);
    if (!fs.existsSync(coursePath)) {
      return null;
    }

    // Get all markdown files in the course directory
    const files = fs.readdirSync(coursePath).filter(file => 
      file.endsWith(".md") || 
      (fs.statSync(path.join(coursePath, file)).isDirectory() && 
       fs.existsSync(path.join(coursePath, file, "content.md")))
    );

    const sections = [];
    
    // Process each file or directory
    files.forEach(file => {
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

    const metadata = readCourseMetadata(courseId);
    
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

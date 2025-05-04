import express from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const router = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Root paths for content and translations - using relative paths for deployment compatibility
const contentRoot = path.resolve(process.cwd(), '../content');
const translationsRoot = path.resolve(process.cwd(), '../translations');

console.log("Content root path:", contentRoot);
console.log("Translations root path:", translationsRoot);

// Helper to get content root (simplified to only use main folders)
const getContentRoot = () => contentRoot;

// Helper to get translations root (simplified to only use main folders)
const getTranslationsRoot = () => translationsRoot;

// Helper to read course metadata from Mathigon format
const readCourseMetadata = (courseId) => {
  try {
    const contentRoot = getContentRoot();
    
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
      const parsedData = JSON.parse(data);
      return parsedData;
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

// Read course metadata (simplified since we only have one content source)
const readCourseMeta = (courseId) => {
  return readCourseMetadata(courseId);
};

// Helper to read content from a course directory (Mathigon format)
const readCourseContent = (courseId) => {
  try {
    const contentRoot = getContentRoot();
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
        const startIndex = current.index;
        const endIndex = next ? next.index : mainContent.length;
        
        // Extract the section content
        const sectionContent = mainContent.substring(startIndex, endIndex);
        
        // Add to sections array
        sections.push({
          id: current.id,
          title: current.title,
          content: sectionContent
        });
      }
    } else {
      // No main content.md file, look for individual markdown files
      const files = fs.readdirSync(coursePath).filter(file => 
        file.endsWith(".md") && file !== "content.md"
      );
      
      // Process each markdown file as a section
      files.forEach(file => {
        const sectionId = file.replace(".md", "");
        const filePath = path.join(coursePath, file);
        const content = fs.readFileSync(filePath, "utf8");
        
        // Extract title from the content (first heading)
        const titleMatch = content.match(/# ([^\n]+)/);
        const title = titleMatch ? titleMatch[1] : sectionId;
        
        sections.push({
          id: sectionId,
          title: title,
          content: content
        });
      });
    }
    
    // Get course metadata
    const metadata = readCourseMetadata(courseId);
    
    // Return the structured content
    return {
      metadata: metadata,
      content: {
        id: courseId,
        sections: sections
      }
    };
  } catch (error) {
    console.error(`Error reading content for ${courseId}:`, error);
    return null;
  }
};

// Helper to get available translations
const getTranslations = (courseId) => {
  try {
    const contentRoot = getContentRoot();
    const translationsRoot = getTranslationsRoot();
    
    // Check if course exists
    const coursePath = path.join(contentRoot, courseId);
    if (!fs.existsSync(coursePath)) {
      return [{ code: "en", name: "English" }];
    }
    
    // Always include English
    const availableTranslations = [{ code: "en", name: "English" }];
    
    // Check the translations directory
    if (fs.existsSync(translationsRoot)) {
      const langDirs = fs.readdirSync(translationsRoot).filter(dir => 
        fs.statSync(path.join(translationsRoot, dir)).isDirectory()
      );
      
      // Check each language directory for this course
      langDirs.forEach(langCode => {
        const langPath = path.join(translationsRoot, langCode, courseId);
        if (fs.existsSync(langPath)) {
          // Get language name from the code (simple mapping)
          let langName = "";
          switch (langCode) {
            case "es": langName = "Español"; break;
            case "fr": langName = "Français"; break;
            case "de": langName = "Deutsch"; break;
            case "it": langName = "Italiano"; break;
            case "pt": langName = "Português"; break;
            case "ru": langName = "Русский"; break;
            case "zh": langName = "中文"; break;
            case "ja": langName = "日本語"; break;
            case "ko": langName = "한국어"; break;
            default: langName = langCode.toUpperCase();
          }
          
          availableTranslations.push({
            code: langCode,
            name: langName
          });
        }
      });
    }
    
    return availableTranslations;
  } catch (error) {
    console.error(`Error getting translations for ${courseId}:`, error);
    return [{ code: "en", name: "English" }];
  }
};

// Get translations (simplified since we only have one source)
const getAllTranslations = (courseId) => {
  return getTranslations(courseId);
};

// Helper to get translated content
const getTranslatedContent = (courseId, langCode) => {
  try {
    // If English, just return the original content
    if (langCode === "en") {
      return readCourseContent(courseId);
    }
    
    const translationsRoot = getTranslationsRoot();
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

// ROUTE: Scan and get enhanced course information from both content and translations directories
router.get("/scan", (req, res) => {
  try {
    // Get all course directories from content folder
    const contentDirs = fs.existsSync(contentRoot) ? 
      fs.readdirSync(contentRoot).filter(dir => 
        fs.statSync(path.join(contentRoot, dir)).isDirectory()
      ) : [];
    
    // Get all translation directories
    const translationDirs = fs.existsSync(translationsRoot) ? 
      fs.readdirSync(translationsRoot).filter(dir => 
        fs.statSync(path.join(translationsRoot, dir)).isDirectory()
      ) : [];
      
    // Get all unique course IDs including those in translations
    const uniqueCourseIds = new Set(contentDirs);
    
    // Add courses that might only exist in translations
    translationDirs.forEach(langCode => {
      const langPath = path.join(translationsRoot, langCode);
      if (fs.existsSync(langPath)) {
        const coursesInLang = fs.readdirSync(langPath).filter(dir => 
          fs.statSync(path.join(langPath, dir)).isDirectory()
        );
        coursesInLang.forEach(courseId => uniqueCourseIds.add(courseId));
      }
    });
    
    // Process each course
    const courses = Array.from(uniqueCourseIds).map(courseId => {
      // Get base metadata
      const metadata = readCourseMetadata(courseId);
      if (!metadata) return null;
      
      // Get course content to extract sections
      const content = readCourseContent(courseId);
      const sections = content?.content?.sections || [];
      
      // Get available translations
      const translations = getTranslations(courseId);
      
      // Create a complete course object
      return {
        ...metadata,
        sections: sections.map(section => ({
          id: section.id,
          title: section.title
        })),
        translations: translations.languages || [],
        // Calculate a proper thumbnail URL
        thumbnail: `/api/content/${courseId}/icon.png`
      };
    }).filter(Boolean);
    
    console.log(`Scanned ${courses.length} courses from content and translations directories`);
    res.json({ courses });
  } catch (error) {
    console.error("Error scanning courses:", error);
    res.status(500).json({ error: "Failed to scan courses" });
  }
});

// Make sure routes are registered in order of specificity (most specific first)

// ROUTE: Get specific file from a course directory (like content.md, icon.png, etc.)
router.get("/:courseId/:fileName", (req, res) => {
  const { courseId, fileName } = req.params;
  const filePath = path.join(contentRoot, courseId, fileName);
  
  console.log(`Attempting to serve file: ${filePath}`);
  
  if (fs.existsSync(filePath)) {
    // Determine content type based on file extension
    const ext = path.extname(fileName).toLowerCase();
    let contentType = 'text/plain';
    
    if (ext === '.md') contentType = 'text/markdown';
    else if (ext === '.json') contentType = 'application/json';
    else if (ext === '.png') contentType = 'image/png';
    else if (ext === '.jpg' || ext === '.jpeg') contentType = 'image/jpeg';
    else if (ext === '.svg') contentType = 'image/svg+xml';
    
    res.set('Content-Type', contentType);
    return res.sendFile(filePath);
  } else {
    console.error(`File not found: ${filePath}`);
    return res.status(404).json({ error: "File not found" });
  }
});

// ROUTE: Get available translations for a course (languages endpoint)
router.get("/translations/:courseId/languages", (req, res) => {
  const { courseId } = req.params;
  const translations = getTranslations(courseId);
  res.json(translations);
});

// ROUTE: Get translated content for a course
router.get("/translations/:courseId/:langCode", (req, res) => {
  const { courseId, langCode } = req.params;
  
  // Special handling for the languages endpoint, which should be handled by the route above
  if (langCode === 'languages') {
    return res.status(404).json({ error: "Use /translations/:courseId/languages endpoint instead" });
  }
  
  const content = getTranslatedContent(courseId, langCode);
  
  if (!content) {
    return res.status(404).json({ error: "Course or translation not found" });
  }
  
  res.json(content);
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

// Endpoint to list all directories in the content folder
router.get("/list", (req, res) => {
  try {
    // Get the content directory root path
    const contentDirPath = path.resolve(contentRoot);
    
    // Check if the directory exists
    if (!fs.existsSync(contentDirPath)) {
      return res.status(404).json({ 
        error: 'Content directory not found',
        directories: [] 
      });
    }
    
    // Read the content directory
    const directories = fs.readdirSync(contentDirPath)
      .filter(dir => {
        const dirPath = path.join(contentDirPath, dir);
        // Only include directories, not files
        return fs.statSync(dirPath).isDirectory();
      });
    
    console.log(`Found ${directories.length} course directories in ${contentDirPath}`);
    res.json(directories);
  } catch (error) {
    console.error("Error listing content directories:", error);
    res.status(500).json({ 
      error: "Failed to list content directories",
      directories: []
    });
  }
});

export default router;

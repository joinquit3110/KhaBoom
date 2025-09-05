# Kha-Boom! UI/UX Rework Plan

## Design System

### Brand Identity
- **Name**: Kha-Boom!
- **Tagline**: "Explosive Learning Experience"
- **Theme**: Modern, vibrant, playful yet professional educational platform

### Color Palette
- **Primary Gradient**: `linear-gradient(135deg, #667eea 0%, #764ba2 100%)` (Purple to Violet)
- **Secondary Gradient**: `linear-gradient(135deg, #f093fb 0%, #f5576c 100%)` (Pink to Red)
- **Accent Gradient**: `linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)` (Blue to Cyan)
- **Success**: `#10b981` (Emerald)
- **Warning**: `#f59e0b` (Amber)
- **Error**: `#ef4444` (Red)
- **Background**: `#0f0f23` (Dark) / `#ffffff` (Light)
- **Glass Effect**: `rgba(255, 255, 255, 0.1)` with `backdrop-filter: blur(10px)`

### Visual Effects
1. **Glass Morphism**:
   - Background: `rgba(255, 255, 255, 0.1)`
   - Backdrop Filter: `blur(10px)`
   - Border: `1px solid rgba(255, 255, 255, 0.2)`
   - Box Shadow: `0 8px 32px rgba(31, 38, 135, 0.37)`

2. **Liquid Effects**:
   - Smooth animations with `cubic-bezier(0.4, 0, 0.2, 1)`
   - Blob animations using CSS keyframes
   - Wave patterns for backgrounds

3. **Gradients**:
   - Multi-color gradients for buttons and cards
   - Animated gradient backgrounds
   - Gradient text effects

### Typography
- **Headings**: 'Poppins', sans-serif (Bold)
- **Body**: 'Inter', sans-serif
- **Code**: 'Fira Code', monospace

## Page Structure

### 1. Landing Page (landing.pug)
- Custom header with navigation (Home, Courses, About)
- Hero section with animated gradient background
- Features showcase with glass cards
- Call-to-action section
- Custom footer

### 2. Courses Page (formerly home.pug)
- Integrated search bar at top
- Sorting/filter options
- Card-based course grid
- Each card shows hero.jpg, title, description
- "Start Learning" buttons with auth check

### 3. About Page (about.pug)
- Mission statement
- Team showcase
- Platform features
- Contact information

### 4. Account Pages
- Login/Signup with glass morphism cards
- Profile page with gradient headers
- Settings with modern toggle switches
- Dashboard with data visualization

## Component Design Patterns

### Headers
- Sticky navigation with glass effect
- Logo on left
- Nav links in center
- Auth buttons/profile on right
- Mobile hamburger menu

### Cards
```scss
.glass-card {
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border-radius: 20px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  padding: 2rem;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  
  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
  }
}
```

### Buttons
```scss
.btn-gradient {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 50px;
  padding: 12px 32px;
  font-weight: 600;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
    transition: left 0.5s;
  }
  
  &:hover::before {
    left: 100%;
  }
}
```

## Implementation Order

1. **Phase 1**: Global Styles
   - Create `_variables.scss` with design tokens
   - Update `main.scss` with base styles
   - Create reusable component styles

2. **Phase 2**: Core Pages
   - Landing page with custom header
   - Transform home to courses page
   - Create about page

3. **Phase 3**: Authentication UI
   - Update header with auth states
   - Profile dropdown menu
   - Redesign account pages

4. **Phase 4**: Interactive Elements
   - Add liquid animations
   - Implement sorting/filtering
   - Auth-based button behavior

## File Modifications

### Templates to Update:
- `/server/templates/home.pug` → `/server/templates/courses.pug`
- Create `/server/templates/landing.pug`
- Create `/server/templates/about.pug`
- Update all `/server/templates/accounts/*.pug`
- Remove Mathigon branding from all templates

### Styles to Update:
- `/frontend/main.scss` - Global styles
- `/frontend/course.css` - Course card styles
- `/frontend/accounts.scss` - Account page styles
- `/frontend/dashboard.scss` - Dashboard styles

### TypeScript to Update:
- `/frontend/main.ts` - Navigation and auth logic
- `/frontend/accounts.ts` - Account interactions
- `/server/serve.ts` - Route updates

## Responsive Design Breakpoints
- Mobile: < 640px
- Tablet: 640px - 1024px
- Desktop: > 1024px

## Animation Guidelines
- Use GPU-accelerated properties (transform, opacity)
- Limit animations to 300-500ms duration
- Use ease-out timing for enter animations
- Use ease-in timing for exit animations
- Implement reduced motion for accessibility

## Accessibility Standards
- WCAG 2.1 AA compliance
- Proper color contrast ratios
- Keyboard navigation support
- Screen reader friendly markup
- Focus indicators on interactive elements

## Performance Optimization
- Lazy load images
- Use CSS containment for cards
- Optimize gradient rendering
- Minimize reflows and repaints
- Use will-change sparingly

## Testing Checklist
- [ ] All pages load without errors
- [ ] Authentication flow works correctly
- [ ] Course cards display hero images
- [ ] Search functionality integrated
- [ ] Sorting options functional
- [ ] Mobile responsive design
- [ ] Dark/light mode toggle works
- [ ] Profile dropdown functions
- [ ] Start Learning button auth check
- [ ] All Mathigon references removed

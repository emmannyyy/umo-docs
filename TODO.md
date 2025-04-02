# UmoEditor Document App - TODO List

## Current Status
- Basic Vue Router setup is complete
- HomePage component created
- EditorView component created
- AppEditor component extracted from App.vue
- Document loading and saving functionality implemented

## High Priority Tasks
- [ ] Implement file Upload function to work with supabase Storage
- [ ] Set up deployment on to Vercel
- [ ] Set up Auth 
- [ ] Test navigation between HomePage and EditorView
- [ ] Implement document listing on HomePage (fetch from Supabase)
- [ ] Add document filtering and sorting on HomePage
- [ ] Test document creation from HomePage
- [ ] Fix any remaining routing issues

## Medium Priority Tasks
- [ ] Implement document deletion functionality
- [ ] Add document duplication feature
- [ ] Create document templates system
- [ ] Add document metadata (last edited, created date, etc.)
- [ ] Improve error handling and user feedback
- [ ] Set up logos for documents


## Low Priority Tasks
- [ ] Implement user authentication
- [ ] Add user profiles
- [ ] Create document sharing functionality
- [ ] Add document version history
- [ ] Implement collaborative editing features

## Technical Debt
- [ ] Refactor component structure for better maintainability
- [ ] Improve error handling across the application
- [ ] Add comprehensive logging
- [ ] Write unit and integration tests
- [ ] Optimize document loading performance
- [ ] Ideally find a way to handle subscripts in Katex instead of "_" (this will be the biggest fking fix ever)

## Bug Fixes
- [x] Fix "Cannot access 'loadDocument' before initialization" error
- [x] Fix UmoEditor initialization issues
- [ ] Address any passive event listener warnings
- [ ] Fix content format issues when loading documents 
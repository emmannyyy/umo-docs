import { supabase } from '../utils/supabaseClient'

/**
 * Save a document to Supabase
 * @param {Object} document - The document object containing all document data
 * @returns {Promise} - The result of the insert/update operation with the document data
 */
export async function saveDocument(document) {
  try {
    // Add timestamps
    const now = new Date().toISOString()
    const documentWithTimestamps = {
      ...document,
      updated_at: now,
    }
    
    let result;
    
    // If document has an id, update it; otherwise create a new document
    if (document.id) {
      console.log(`Updating document with ID: ${document.id}`)
      result = await supabase
        .from('documents')
        .update(documentWithTimestamps)
        .eq('id', document.id)
        .select()
    } else {
      // For new documents, add created_at
      console.log('Creating new document')
      documentWithTimestamps.created_at = now
      result = await supabase
        .from('documents')
        .insert(documentWithTimestamps)
        .select()
    }
    
    // Check for errors
    if (result.error) {
      console.error('Error in saveDocument:', result.error)
      return { error: result.error }
    }
    
    // Return data
    return { data: result.data, error: null }
  } catch (err) {
    console.error('Exception in saveDocument:', err)
    return { error: err, data: null }
  }
}

/**
 * Get a document by ID
 * @param {string} id - The document ID
 * @returns {Promise} - The document object
 */
export async function getDocumentById(id) {
  console.log(`Fetching document with ID: ${id}`)
  
  try {
    const { data, error } = await supabase
      .from('documents')
      .select('*')
      .eq('id', id)
      .single()
      
    if (error) {
      console.error('Error fetching document:', error)
      throw error
    }
    
    if (!data) {
      console.error('Document not found')
      throw new Error('Document not found')
    }
    
    console.log('Document fetched successfully:', data)
    
    // Normalize content to ensure it's in a valid format
    if (data.content) {
      // For backward compatibility, we need to handle content in various formats
      
      // Case 1: Content is a string - could be HTML or stringified JSON
      if (typeof data.content === 'string') {
        try {
          // Try to parse as JSON if it's a JSON string
          const parsed = JSON.parse(data.content)
          data.content = {
            original: data.content,
            json: parsed
          }
          console.log('Successfully parsed content from JSON string')
        } catch (e) {
          // If it's not JSON, assume it's HTML
          data.content = {
            original: data.content,
            html: data.content
          }
          console.log('Content is HTML string, normalized to object')
        }
      } 
      // Case 2: Content is already an object - ensure it has the expected properties
      else if (typeof data.content === 'object') {
        console.log('Content is already an object with keys:', Object.keys(data.content))
        
        // If content is an object without html/json properties, but with 'original'
        if (!data.content.html && !data.content.json && data.content.original) {
          // Try to determine if original is HTML or JSON
          try {
            const parsed = JSON.parse(data.content.original)
            data.content.json = parsed
          } catch (e) {
            // If not parseable as JSON, assume it's HTML
            data.content.html = data.content.original
          }
        }
        
        // If we have a raw content object with no recognized properties
        if (!data.content.html && !data.content.json && !data.content.original) {
          console.warn('Content object has no recognized properties')
          data.content = {
            original: JSON.stringify(data.content),
            json: data.content
          }
        }
      } 
      // Case 3: Content is neither string nor object (unlikely)
      else {
        console.warn('Document has unexpected content type:', typeof data.content)
        data.content = {
          original: String(data.content)
        }
      }
    } else {
      console.warn('Document has no content')
      data.content = {
        html: '',
        original: ''
      }
    }
    
    return data
  } catch (err) {
    console.error('Error in getDocumentById:', err)
    throw err
  }
}

/**
 * Get all documents for a user
 * @param {string} userId - The user ID (optional)
 * @returns {Promise} - Array of document objects
 */
export async function getUserDocuments(userId) {
  let query = supabase
    .from('documents')
    .select('*')
    .order('updated_at', { ascending: false })
  
  // If userId is provided, filter by user_id
  if (userId) {
    query = query.eq('user_id', userId)
  }
    
  const { data, error } = await query
  
  if (error) throw error
  return data
}

/**
 * Delete a document
 * @param {string} id - The document ID
 * @returns {Promise} - Result of the delete operation
 */
export async function deleteDocument(id) {
  return supabase
    .from('documents')
    .delete()
    .eq('id', id)
} 
import { createClient } from '@supabase/supabase-js'
import { randomUUID } from 'crypto'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

interface CopyResult {
  success: boolean
  error?: string
}

/**
 * Copie une photo du bucket privé (review-uploads) vers le bucket public
 * (review-photos) après approbation. Idempotent : si la photo est déjà
 * approuvée, ne fait rien et renvoie succès immédiatement (aucune duplication).
 *
 * Point d'entrée unique partagé par l'approbation automatique (moderate,
 * action approve) et la relance manuelle (photos/retry-copy) — même logique,
 * deux appelants.
 *
 * Ce n'est pas une transaction atomique au sens strict (Storage est un
 * service HTTP externe, pas une table Postgres) : en cas d'échec, la photo
 * reste 'pending' avec copy_error renseigné, le fichier privé n'est jamais
 * supprimé, et aucun fichier public n'est jamais créé.
 */
export async function copyReviewPhotoToPublic(photoId: string): Promise<CopyResult> {
  const { data: photo, error: fetchError } = await supabaseAdmin
    .from('review_photos')
    .select('id, review_id, private_storage_path, status')
    .eq('id', photoId)
    .maybeSingle()

  if (fetchError || !photo) {
    return { success: false, error: 'Photo introuvable' }
  }

  // Idempotence : déjà traitée, aucun retraitement ni duplication.
  if (photo.status === 'approved') {
    return { success: true }
  }

  if (!photo.private_storage_path) {
    return { success: false, error: 'Aucun fichier source enregistré' }
  }

  await supabaseAdmin
    .from('review_photos')
    .update({ last_copy_attempt_at: new Date().toISOString() })
    .eq('id', photoId)

  const { data: fileBlob, error: downloadError } = await supabaseAdmin.storage
    .from('review-uploads')
    .download(photo.private_storage_path)

  if (downloadError || !fileBlob) {
    const message = downloadError?.message || 'Téléchargement impossible'
    await supabaseAdmin.from('review_photos').update({ copy_error: message }).eq('id', photoId)
    return { success: false, error: message }
  }

  const ext = photo.private_storage_path.split('.').pop() || 'jpg'
  const publicPath = `${photo.review_id}/${randomUUID()}.${ext}`

  const { error: uploadError } = await supabaseAdmin.storage
    .from('review-photos')
    .upload(publicPath, fileBlob, { contentType: fileBlob.type || undefined, upsert: false })

  if (uploadError) {
    await supabaseAdmin.from('review_photos').update({ copy_error: uploadError.message }).eq('id', photoId)
    return { success: false, error: uploadError.message }
  }

  await supabaseAdmin
    .from('review_photos')
    .update({ public_storage_path: publicPath, status: 'approved', copy_error: null })
    .eq('id', photoId)

  // Suppression du fichier privé — best-effort, ne fait jamais échouer l'opération globale.
  const { error: removeError } = await supabaseAdmin.storage
    .from('review-uploads')
    .remove([photo.private_storage_path])

  if (removeError) {
    console.error(`Nettoyage du fichier privé échoué pour la photo ${photoId}:`, removeError.message)
  }

  return { success: true }
}

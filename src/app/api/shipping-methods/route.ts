import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET() {
  try {
    const { data, error } = await supabase
      .from('shipping_methods')
      .select('id, title, description, description_2, price, image_url, badge, free_threshold, sort_order')
      .eq('enabled', true)
      .order('sort_order', { ascending: true })

    if (error) {
      console.error('Error fetching shipping methods:', error)
      return NextResponse.json({ methods: [] })
    }

    return NextResponse.json({ methods: data || [] })
  } catch (error) {
    console.error('Error in shipping-methods route:', error)
    return NextResponse.json({ methods: [] })
  }
}

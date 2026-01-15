import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Client Supabase côté serveur
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

interface ShippingSettings {
  freeShippingThreshold: number
  standardShippingPrice: number
  expressShippingPrice: number
  enableExpressShipping: boolean
}

const defaultShippingSettings: ShippingSettings = {
  freeShippingThreshold: 150,
  standardShippingPrice: 9.90,
  expressShippingPrice: 14.90,
  enableExpressShipping: true,
}

export async function GET() {
  try {
    const { data, error } = await supabase
      .from('settings')
      .select('key, value')
      .eq('key', 'shipping')
      .single()

    if (error || !data) {
      // Retourner les valeurs par défaut si pas de config
      return NextResponse.json({ shipping: defaultShippingSettings })
    }

    const shippingValue = data.value as ShippingSettings

    return NextResponse.json({
      shipping: {
        freeShippingThreshold: shippingValue.freeShippingThreshold ?? defaultShippingSettings.freeShippingThreshold,
        standardShippingPrice: shippingValue.standardShippingPrice ?? defaultShippingSettings.standardShippingPrice,
        expressShippingPrice: shippingValue.expressShippingPrice ?? defaultShippingSettings.expressShippingPrice,
        enableExpressShipping: shippingValue.enableExpressShipping ?? defaultShippingSettings.enableExpressShipping,
      }
    })
  } catch (error) {
    console.error('Error fetching settings:', error)
    return NextResponse.json({ shipping: defaultShippingSettings })
  }
}

// CheckoutWithScript.jsx
import Script from 'next/script'
import { CheckoutDialog } from './CheckoutDialog'

export const CheckoutWithScript = (props) => {
  return (
    <>
      <Script
        src="https://js.paystack.co/v2/inline.js"
        strategy="lazyOnload"
      />
      <CheckoutDialog {...props} />
    </>
  )
}
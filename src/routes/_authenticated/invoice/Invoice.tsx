import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_authenticated/invoice/Invoice')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/_authenticated/invoice/Invoice"!</div>
}

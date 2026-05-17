import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Board } from './components/kanban/Board'

console.log('🔥 APP.TSX CARGADO')

const queryClient = new QueryClient()

function App() {
  console.log('🔥 APP RENDERIZADO')
  return (
    <QueryClientProvider client={queryClient}>
      <div style={{ background: '#000', minHeight: '100vh' }}>
        <h1 style={{ color: 'white', padding: '20px' }}>Test: App renderiza</h1>
        <Board />
      </div>
    </QueryClientProvider>
  )
}

export default App
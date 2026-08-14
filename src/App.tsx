import { Routes, Route } from 'react-router-dom'
import { AppShell } from './components/layout/AppShell'
import { Dashboard } from './pages/Dashboard'
import { CampaignsPage } from './pages/CampaignsPage'
import { CampaignDetail } from './pages/CampaignDetail'
import { CreaturesPage } from './pages/CreaturesPage'
import { CollectionPage } from './pages/CollectionPage'
import { EntityDetail } from './pages/EntityDetail'
import { PlaceholderPage } from './pages/PlaceholderPage'
import { NotFound } from './pages/NotFound'

function App() {
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route path="/" element={<Dashboard />} />

        <Route path="/campanhas" element={<CampaignsPage />} />
        <Route path="/campanhas/:id" element={<CampaignDetail />} />

        <Route path="/criaturas" element={<CreaturesPage />} />
        <Route path="/criaturas/:id" element={<EntityDetail type="monster" />} />

        <Route path="/antagonistas" element={<CollectionPage type="antagonist" />} />
        <Route path="/antagonistas/:id" element={<EntityDetail type="antagonist" />} />

        <Route path="/personagens" element={<CollectionPage type="npc" />} />
        <Route path="/personagens/:id" element={<EntityDetail type="npc" />} />

        <Route path="/locais" element={<CollectionPage type="location" />} />
        <Route path="/locais/:id" element={<EntityDetail type="location" />} />

        <Route path="/documentos" element={<CollectionPage type="document" />} />
        <Route path="/documentos/:id" element={<EntityDetail type="document" />} />

        <Route path="/pistas" element={<CollectionPage type="clue" />} />
        <Route path="/pistas/:id" element={<EntityDetail type="clue" />} />

        <Route path="/experimentos" element={<CollectionPage type="experiment" />} />
        <Route path="/experimentos/:id" element={<EntityDetail type="experiment" />} />

        <Route path="/organizacoes" element={<CollectionPage type="organization" />} />
        <Route path="/organizacoes/:id" element={<EntityDetail type="organization" />} />

        <Route path="/ideias" element={<CollectionPage type="idea" />} />
        <Route path="/ideias/:id" element={<EntityDetail type="idea" />} />

        <Route path="/paginas" element={<CollectionPage type="page" />} />
        <Route path="/paginas/:id" element={<EntityDetail type="page" />} />

        <Route
          path="/conexoes"
          element={
            <PlaceholderPage
              icon="🔗"
              title="Conexões"
              description="Em breve: um mapa visual conectando campanhas, personagens, locais e segredos de todo o universo."
            />
          }
        />

        <Route
          path="/arquivo"
          element={<PlaceholderPage icon="🗑️" title="Arquivo" description="Páginas arquivadas aparecerão aqui." />}
        />

        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  )
}

export default App

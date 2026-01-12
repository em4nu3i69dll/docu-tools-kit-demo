import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import Footer from './components/Footer';
import Home from './pages/Home';
import CompressImage from './pages/CompressImage';
import ResizeImage from './pages/ResizeImage';
import CropImage from './pages/CropImage';
import ConvertToJpg from './pages/ConvertToJpg';
import ConvertFromJpg from './pages/ConvertFromJpg';
import RotateImage from './pages/RotateImage';
import WatermarkImage from './pages/WatermarkImage';
import EditorFotos from './pages/EditorFotos';
import HtmlToImage from './pages/HtmlToImage';
import RemoveBackground from './pages/RemoveBackground';
import MergePdf from './pages/MergePdf';
import SplitPdf from './pages/SplitPdf';
import CompressPdf from './pages/CompressPdf';
import JpgToPdf from './pages/JpgToPdf';
import PdfToJpg from './pages/PdfToJpg';
import PdfToWord from './pages/PdfToWord';
import Mp4ToGif from './pages/Mp4ToGif';
import ConvertirVideo from './pages/ConvertirVideo';
import './App.css';

function App() {
  return (
    <BrowserRouter>
      <div className="diseno-aplicacion">
        <Header />
        <main className="contenido-principal">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/comprimir-imagen" element={<CompressImage />} />
            <Route path="/redimensionar-imagen" element={<ResizeImage />} />
            <Route path="/recortar-imagen" element={<CropImage />} />
            <Route path="/convertir-a-jpg" element={<ConvertToJpg />} />
            <Route path="/convertir-desde-jpg" element={<ConvertFromJpg />} />
            <Route path="/editor-fotos" element={<EditorFotos />} />
            <Route path="/girar-imagen" element={<RotateImage />} />
            <Route path="/marca-agua" element={<WatermarkImage />} />
            <Route path="/html-a-imagen" element={<HtmlToImage />} />
            <Route path="/remover-fondo" element={<RemoveBackground />} />
            <Route path="/unir-pdf" element={<MergePdf />} />
            <Route path="/dividir-pdf" element={<SplitPdf />} />
            <Route path="/comprimir-pdf" element={<CompressPdf />} />
            <Route path="/jpg-a-pdf" element={<JpgToPdf />} />
            <Route path="/pdf-a-jpg" element={<PdfToJpg />} />
            <Route path="/pdf-a-word" element={<PdfToWord />} />
            <Route path="/mp4-a-gif" element={<Mp4ToGif />} />
            <Route path="/convertir-video" element={<ConvertirVideo />} />
            <Route path="*" element={<Home />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </BrowserRouter>
  );
}

export default App;

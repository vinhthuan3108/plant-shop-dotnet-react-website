import './App.css'
// 1. Import cái file bạn vừa tạo
import Categories from './components/Categories'; 

function App() {
  return (
    <>
      <h1>Chào mừng đến với Shop Cây Cảnh</h1>
      
      {/* 2. Hiển thị nó ra ở đây */}
      <Categories /> 
    </>
  )
}

export default App
import React from 'react';
import './IntroPage.css';
// Nhớ import logo của bạn vào đây (đường dẫn có thể khác tùy máy bạn)
import logo from '../../assets/images/logo.png'; 

const IntroPage = () => {
  return (
    <div className="intro-container">
      
      {/* Phần đầu trang: Logo & Tiêu đề */}
      <div className="intro-header">
        <img src={logo} alt="PLANT SHOP" className="intro-logo" />
        <h1 className="intro-title">PLANT SHOP</h1>
        <p className="intro-slogan">Cho trải nghiệm "không chỉ là cây cảnh"!</p>
      </div>

      {/* Nội dung chính */}
      <div className="intro-content">
        <p className="intro-text">
          Cây cảnh, từ trước đến nay vẫn được xem như vật trang trí, làm đẹp không gian sống cho con người. Cây để bàn, bonsai, terrarium, cây thuỷ sinh hoặc cây treo chậu... mỗi loại mỗi cây đều có ý nghĩa và vẻ đẹp riêng của mình, góp phần đáng kể làm cho cuộc sống chúng ta thêm sinh động, trở nên đáng yêu và thanh bình hơn.
        </p>
        <p className="intro-text">
          Nhưng tại <strong>Vườn Cây Việt</strong>, chúng tôi muốn mang đến cho bạn không chỉ là cây cảnh, chúng tôi muốn mang đến cho bạn những trải nghiệm tuyệt vời mà không nơi nào có. Vườn Cây Việt hiểu rằng đối với cây cảnh, bạn sẽ muốn:
        </p>

        <ul className="intro-list">
          <li>Hiểu ý nghĩa (một cách sâu sắc, đúng đắn và vững chắc) về loại cây mà mình chọn.</li>
          <li>Hiểu phong thuỷ chính xác của cây để mang lại sự may mắn và thành công cho công việc, cuộc sống.</li>
          <li>Hiểu câu chuyện tạo nên ý nghĩa đằng sau từng loại cây.</li>
          <li>Hiểu cách chăm sóc để cây luôn trong trạng thái tốt nhất.</li>
          <li>Lựa chọn loại chậu và phụ kiện chăm sóc cây sao cho phù hợp với nhu cầu.</li>
        </ul>

        <p className="intro-text">
          Và một điều có thể bạn chưa để ý... là thông qua loại cây bạn chọn, bạn sẽ thể hiện được <strong>cá tính</strong> và <strong>không gì độc đáo</strong> của bản thân mà không cần nói ra mà người khác đã tự hiểu rồi. Bạn làm điều đó bằng cách nào?
        </p>
        <p className="intro-text">
          Rất khó, bởi không phải ai, dù thích chơi cây và yêu cây, đều có thể hiểu rõ từng ấy vấn đề. Nhưng không sao!
        </p>
        <p className="intro-text">
          Hãy một lần đến với <strong>Vườn Cây Việt</strong>, chúng tôi không hứa gì ngoài việc mang đến cho bạn các sản phẩm cây cảnh và dịch vụ chất lượng cao nhất thông qua quy trình bán hàng, giao hàng, chăm sóc khách hàng, chăm sóc sản phẩm tiêu chuẩn... VỚI GIÁ CẢ PHẢI CHĂNG VÀ PHÙ HỢP TÚI TIỀN.
        </p>

        {/* Các mục Sứ mệnh, Tầm nhìn */}
        <h3 className="intro-heading">Sứ mệnh</h3>
        <p className="intro-text">
          Với ý nghĩa đó, <strong>Vườn Cây Việt</strong> đặt ra cho mình sứ mệnh cung cấp các loại cây làm đẹp không gian sống và không chỉ vậy, còn cung cấp thêm các giá trị tinh thần cho khách hàng, là điểm đến cho mọi khách hàng có nhu cầu tìm mua những cây cảnh trang trí đẹp, phù hợp cá tính, phong thuỷ, không gian sống và làm việc.
        </p>

        <h3 className="intro-heading">Tầm nhìn</h3>
        <p className="intro-text">
          Đến năm 2025, <strong>Vườn Cây Việt</strong> phấn đấu trở thành 1 trong 3 đơn vị dẫn đầu trong lĩnh vực cung cấp cây cảnh để bàn, cây cảnh mini, bonsai, cây thuỷ sinh, terrarium... tại Việt Nam, đồng thời trở thành nhà cung cấp đa dạng các loại hình cây cảnh phù hợp cho nhiều đối tượng khách hàng khác nhau với hệ thống đối tác phân phối rộng khắp cả nước.
        </p>

        <h3 className="intro-heading">Giá trị cốt lõi</h3>
        <ul className="intro-list">
            <li><strong>Chất lượng:</strong> Tập trung vào chất lượng sản phẩm, cam kết chỉ đưa ra thị trường các sản phẩm thực sự chất lượng.</li>
            <li><strong>Chính trực:</strong> Không lừa dối khách hàng, luôn đảm bảo tư vấn cho khách hàng một cách công tâm, khách quan nhất về sản phẩm.</li>
            <li><strong>Sáng tạo, đổi mới:</strong> Không ngừng quan sát, tìm hiểu và học hỏi, từ đó đưa ra các ý tưởng, sản phẩm mới.</li>
            <li><strong>Đồng đội:</strong> Luôn phối hợp tốt giữa các thành viên trong công ty, sẵn sàng chia sẻ, góp ý, động viên và học hỏi lẫn nhau: "vì sự phát triển của từng cá nhân, vì sự phát triển bền vững của công ty".</li>
        </ul>

        <p className="intro-text" style={{marginTop: '30px', fontStyle: 'italic'}}>
            Đừng dừng lại ở đây, hãy khám phá các sản phẩm tại <strong>Vườn Cây Việt</strong> ngay bây giờ!
        </p>
      </div>
    </div>
  );
};

export default IntroPage;
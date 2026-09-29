# JSON Studio

Trang web định dạng, kiểm tra và khám phá JSON ngay trên trình duyệt. Không cần máy chủ hay bước build.

## Sử dụng

Mở `index.html` trong trình duyệt hoặc chạy `python3 -m http.server 8000` trong thư mục này. Dán JSON, rồi chọn **Định dạng JSON**, **Thu gọn** hoặc **Kiểm tra**. Chế độ **Cây** cho phép tìm kiếm, mở và thu gọn các nhánh.

## Cloudflare Pages

Kết nối kho GitHub này với Cloudflare Pages. Chọn **Framework preset: None**, để trống **Build command**, và đặt **Build output directory: .** (thư mục gốc của kho). Không cần biến môi trường.

Mọi thao tác phân tích JSON diễn ra trong trình duyệt; nội dung JSON không được gửi đến máy chủ.

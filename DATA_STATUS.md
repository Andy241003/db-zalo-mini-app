# Trạng thái dữ liệu Frontend — Premier Pearl Hotel Mini App

> Cập nhật: 12/03/2026  
> Legend: ✅ Đang render trên UI | ⚠️ Có trong code nhưng chưa render / đang dùng fallback | ❌ Chưa hoạt động / cần xử lý

---

## 1. Hotel Info
**Endpoint:** `GET /hotel-brands/current`  
**Trạng thái API:** ✅ Hoạt động, trả về dữ liệu thật

| Field | Render ở đâu | Trạng thái |
|---|---|---|
| `hotel_name` | Home (tiêu đề), OA follow card, footer | ✅ Đang render |
| `logo_url` | Home (header + footer), OA follow card | ✅ Đang render |
| `banner_images[0]` | Slider ảnh trang Home (chỉ dùng ảnh đầu tiên) | ✅ Đang render |
| `description` | Đoạn mô tả dưới tên khách sạn trang Home | ✅ Đang render |
| `primary_color` | Màu nền header, nút, icon toàn app | ✅ Đang render |
| `secondary_color` | Màu nền icon nhạt toàn app | ✅ Đang render |
| `phone_number` | Footer "Hotline: ..." | ✅ Đang render |
| `email` | Footer "Email: ..." | ✅ Đang render |
| `address` | Footer địa chỉ | ✅ Đang render |
| `website_url` | Nút icon Website trang Home footer | ✅ Đang render |
| `facebook_url` | Nút icon Facebook trang Home footer | ✅ Đang render |
| `youtube_url` | Nút icon YouTube trang Home footer | ✅ Đang render |
| `google_map_url` | Iframe bản đồ trang Home footer | ✅ Đang render |
| `vr360_url` | Nút "VR360" trên ảnh banner trang Home | ✅ Đang render |
| `intro_video_url` | Nút "Video" trên ảnh banner trang Home | ✅ Đang render |
| `tenant_id` | Truyền vào mọi API call (không hiển thị) | ✅ Đang dùng |
| `zalo_oa_id` | followOA, openChat đặt phòng, navigation chat | ❌ **Null trong DB — followOA/openChat không hoạt động** |
| `slogan` | Có trong type nhưng **không render ở UI** | ⚠️ Chưa dùng |
| `instagram_url` | Có trong type nhưng **không có nút trên UI** | ⚠️ Chưa dùng |
| `tiktok_url` | Có trong type nhưng **không có nút trên UI** | ⚠️ Chưa dùng |

---

## 2. Promotions / Khuyến mãi
**Endpoint:** `GET /promotions?tenant_id=&skip=&limit=`  
**Trạng thái API:** ⚠️ Endpoint hoạt động nhưng DB rỗng — đang dùng fallback mock data

| Field | Render ở đâu | Bắt buộc |
|---|---|---|
| `id` | Dùng để navigate đến `/promotion/:id` | ✅ Bắt buộc |
| `title` | Tên promotion trong card (Home + list) | ✅ Bắt buộc |
| `banner_image` | Ảnh thumbnail card (Home + list), banner trang detail | ✅ Bắt buộc |
| `start_date` | Đếm ngược "Còn X ngày" trên card | ✅ Bắt buộc |
| `end_date` | Đếm ngược + kiểm tra "Đã hết hạn" | ✅ Bắt buộc |
| `description` | Nội dung chi tiết trang promotion-detail | ✅ Bắt buộc |
| `code` | Hiển thị mã + nút copy trang promotion-detail | ✅ Bắt buộc |
| `type` | Badge loại (Voucher/Campaign) promotion-detail | ✅ Bắt buộc |
| `discount_value` | Chưa render trực tiếp trên UI | ⚠️ Chưa dùng |
| `discount_type` | Chưa render trực tiếp trên UI | ⚠️ Chưa dùng |
| `status` | Chưa dùng để lọc | ⚠️ Chưa dùng |
| `max_usage` | Chưa render | ⚠️ Chưa dùng |
| `used_count` | Chưa render | ⚠️ Chưa dùng |
| `tenant_id` | Truyền vào API call | ✅ Bắt buộc |

---

## 3. Rooms / Phòng
**Endpoint:** `GET /room-stays?tenant_id=&skip=&limit=`  
**Trạng thái API:** ⚠️ Endpoint hoạt động nhưng DB rỗng — đang dùng fallback mock data

> ⚠️ **BUG:** `fallbackData.ts` dùng tên field cũ (`room_number`, `image_urls[]`, `price` số, `capacity`, `bed_type`, `amenities`) không khớp với kiểu `Room` thật (`room_name`, `image_url` string, `price` string, `capacity_adults`...). Nếu API trả dữ liệu thật thì ổn, nhưng fallback sẽ render sai.

| Field | Render ở đâu | Bắt buộc |
|---|---|---|
| `id` | Key list | ✅ Bắt buộc |
| `room_name` | Tên phòng trang Booking | ✅ Bắt buộc |
| `image_url` | Ảnh phòng trang Booking | ✅ Bắt buộc |
| `description` | Mô tả phòng (click để expand) | ✅ Bắt buộc |
| `view_type` | Dòng thông số "hướng biển / thành phố..." | ✅ Bắt buộc |
| `capacity_adults` | Dòng thông số "X người lớn tối đa" | ✅ Bắt buộc |
| `capacity_children` | Dòng thông số "X trẻ em tối đa" | ✅ Render nếu > 0 |
| `size_m2` | Dòng thông số "Xm²" | ✅ Render nếu có |
| `has_balcony` | Dòng thông số "Có ban công" | ✅ Render nếu true |
| `vr360_url` | Nút "Xem VR360" | ✅ Render nếu có |
| `video_url` | Nút "Xem Video" | ✅ Render nếu có |
| `price` | **Có trong type nhưng bị comment out trong UI** | ⚠️ Chưa hiển thị |
| `room_type` | **Có trong type nhưng không render** | ⚠️ Chưa dùng |
| `booking_url` | **Không dùng — dùng openChat thay thế** | ⚠️ Không cần thiết |
| `tenant_id` | Truyền vào API call | ✅ Bắt buộc |

> **Lưu ý:** Nút "Đặt phòng" dùng `openChat` qua Zalo OA — cần `zalo_oa_id` trong Hotel.

---

## 4. Facilities / Tiện ích
**Endpoint:** `GET /facilities?tenant_id=&skip=&limit=`  
**Trạng thái API:** ⚠️ Endpoint hoạt động nhưng DB rỗng — đang dùng fallback mock data

| Field | Render ở đâu | Bắt buộc |
|---|---|---|
| `id` | Key list, navigate detail | ✅ Bắt buộc |
| `facility_name` → map thành `utility_name` | Tên tiện ích card Home + trang detail | ✅ Bắt buộc |
| `image_url` → map thành `images[0]` | Ảnh trái card Home + slideshow detail | ✅ Bắt buộc |
| `description` | Mô tả card Home (2 dòng) + nội dung trang detail | ✅ Bắt buộc |
| `vr360_url` | Nút "Xem VR360" card Home + trang detail | ✅ Render nếu có |
| `video_url` | Nút "Xem Video" card Home + trang detail | ✅ Render nếu có |
| `tenant_id` | Truyền vào API call | ✅ Bắt buộc |

> **Lưu ý:** API trả `facility_name` và `image_url` (string) — FE tự map sang `utility_name` và `images[]` trong `getFacilities()`.

---

## 5. Services / Dịch vụ
**Endpoint:** `GET /services?tenant_id=&skip=&limit=`  
**Trạng thái API:** ⚠️ Endpoint hoạt động nhưng DB rỗng — đang dùng fallback mock data

| Field | Render ở đâu | Bắt buộc |
|---|---|---|
| `id` | Key list, navigate detail | ✅ Bắt buộc |
| `service_name` | Tên dịch vụ (list + detail) | ✅ Bắt buộc |
| `type` | Tab lọc theo danh mục trang list | ✅ Bắt buộc |
| `image_url[0]` | Ảnh thumbnail card trang list | ✅ Bắt buộc |
| `image_url[]` | Slideshow ảnh trang detail | ✅ Bắt buộc |
| `price` | Giá trang list (nếu > 0) + trang detail format VND | ✅ Bắt buộc |
| `description` | Mô tả chi tiết trang detail | ✅ Bắt buộc |
| `unit` | **Có trong type nhưng không render ra UI** | ⚠️ Chưa dùng |
| `duration_minutes` | **Có trong type nhưng không render ra UI** | ⚠️ Chưa dùng |
| `requires_schedule` | **Có trong type nhưng không render ra UI** | ⚠️ Chưa dùng |
| `tenant_id` | Truyền vào API call | ✅ Bắt buộc |

---

## 6. Zalo User — Zalo SDK
**Nguồn:** Zalo Mini App SDK (không qua backend)

| Field | Render ở đâu | Trạng thái |
|---|---|---|
| `name` | Lời chào "Xin chào, [tên]!" trang Home | ✅ Hoạt động |
| `avatar` | Ảnh đại diện trang Home | ✅ Hoạt động |
| Phone number | Lưu thông tin khách hàng sau khi nhận voucher | ❌ **Cần VPS Việt Nam** (Render.com IP Mỹ bị Zalo chặn) |

---

## 7. My Promotions / Voucher của tôi
**Nguồn hiện tại:** In-memory (PromotionContext) — mất khi tắt app

| Dữ liệu | Trạng thái |
|---|---|
| Danh sách voucher đã nhận | ⚠️ Chỉ lưu trong RAM, tắt app là mất |
| API lưu/lấy voucher theo user | ❌ Backend chưa có endpoint |

---

## Tóm tắt việc cần làm

| Ưu tiên | Việc cần làm | Bên thực hiện |
|---|---|---|
| 🔴 Cao | Nhập dữ liệu **Promotions** vào DB (title, banner_image, code, start/end_date, description) | Backend |
| 🔴 Cao | Nhập dữ liệu **Facilities** vào DB (facility_name, image_url, description) | Backend |
| 🔴 Cao | Nhập dữ liệu **Services** vào DB (service_name, type, image_url, price, description) | Backend |
| 🔴 Cao | Nhập dữ liệu **Rooms** vào DB (room_name, image_url, view_type, capacity_adults, description) | Backend |
| 🔴 Cao | Điền `zalo_oa_id` vào record khách sạn trong DB | Backend |
| 🟡 Trung bình | Sửa `fallbackData.ts` — roomsMock dùng sai tên field (room_number → room_name, image_urls → image_url...) | Frontend |
| 🟡 Trung bình | Deploy backend lên **VPS Việt Nam** để lấy SĐT hoạt động | DevOps/Backend |
| 🟢 Thấp | Thêm API lưu/lấy My Promotions theo user | Backend |
| 🟢 Thấp | Thêm nút TikTok / Instagram nếu cần | Frontend |

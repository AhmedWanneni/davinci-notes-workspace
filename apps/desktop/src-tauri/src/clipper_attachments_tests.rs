//! Unit tests for clipper attachment URL validation and image content verification.

#[cfg(test)]
mod tests {
  use reqwest::Url;
  use crate::clipper_attachments::{validate_attachment_url, validate_image_content};

  #[test]
  fn test_ssrf_rejects_loopback_and_metadata_and_lan() {
    let forbidden = [
      "http://169.254.169.254/latest/meta-data/",
      "http://169.254.1.1/test.png",
      "http://127.0.0.1:8080/cat.png",
      "http://127.0.0.2:3000/image.jpg",
      "http://localhost:8080/image.png",
      "http://test.localhost/image.png",
      "http://10.0.0.1/cat.png",
      "http://192.168.1.50/photo.jpg",
      "http://172.16.0.5/photo.jpg",
      "http://172.31.255.255/photo.jpg",
      "http://100.64.0.1/image.png",
      "file:///etc/passwd",
      "ftp://example.com/image.png",
      "data:image/png;base64,abc",
      "http://[::1]/cat.png",
      "http://[fe80::1]/cat.png",
      "http://[fc00::1]/cat.png",
    ];

    for url_str in forbidden {
      if let Ok(parsed) = Url::parse(url_str) {
        let result = validate_attachment_url(&parsed);
        assert!(
          result.is_err(),
          "Expected URL {} to be rejected by SSRF validation, but got {:?}",
          url_str,
          result
        );
      }
    }
  }

  #[test]
  fn test_ssrf_allows_public_urls() {
    let allowed = [
      "https://images.unsplash.com/photo-1543852786-1cf6624b9987",
      "https://example.com/assets/cat.png",
      "http://93.184.216.34/photo.jpg",
    ];

    for url_str in allowed {
      let parsed = Url::parse(url_str).unwrap();
      assert!(
        validate_attachment_url(&parsed).is_ok(),
        "Expected URL {} to be allowed",
        url_str
      );
    }
  }

  #[test]
  fn test_validate_image_content_accepts_valid_magic_bytes() {
    let png = [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0x00, 0x00];
    assert!(validate_image_content(Some("image/png"), &png).is_ok());

    let jpeg = [0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10];
    assert!(validate_image_content(Some("image/jpeg"), &jpeg).is_ok());

    let gif = b"GIF89a\x01\x00\x01\x00";
    assert!(validate_image_content(Some("image/gif"), gif).is_ok());

    let mut webp = vec![b'R', b'I', b'F', b'F', 0, 0, 0, 0, b'W', b'E', b'B', b'P'];
    webp.extend_from_slice(b"VP8 ");
    assert!(validate_image_content(Some("image/webp"), &webp).is_ok());

    let svg = b"<svg xmlns=\"http://www.w3.org/2000/svg\"><circle r=\"5\"/></svg>";
    assert!(validate_image_content(Some("image/svg+xml"), svg).is_ok());
  }

  #[test]
  fn test_validate_image_content_rejects_html_and_scripts() {
    let html1 = b"<!DOCTYPE html><html><head><title>Error</title></head><body>404 Not Found</body></html>";
    assert!(validate_image_content(Some("image/png"), html1).is_err());

    let html2 = b"<html><body><script>alert(1)</script></body></html>";
    assert!(validate_image_content(Some("image/png"), html2).is_err());

    let svg_with_script = b"<svg><script>alert(1)</script></svg>";
    assert!(validate_image_content(Some("image/svg+xml"), svg_with_script).is_err());

    let random_text = b"This is just a plain text file, not an image!";
    assert!(validate_image_content(Some("image/png"), random_text).is_err());

    let empty = b"";
    assert!(validate_image_content(Some("image/png"), empty).is_err());
  }
}

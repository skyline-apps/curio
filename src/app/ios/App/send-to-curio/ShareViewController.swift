//
//  ShareViewController.swift
//  mindlib
//
//  Created by Carsten Klaffke on 05.07.20.
//

import MobileCoreServices
import Social
import UIKit
import UniformTypeIdentifiers

class ShareItem {
    
    public var title: String?
    public var type: String?
    public var url: String?
}

class ShareViewController: UIViewController {
    
    private var shareItems: [ShareItem] = []
    private let appGroupId = "group.ooo.curi.app" // Ensure this App Group is added to both targets' entitlements in Xcode

    private func baseURL() -> URL {
        // Read from the extension's Info.plist. Fallback to production domain.
        if let raw = Bundle.main.object(forInfoDictionaryKey: "CURIO_URL") as? String,
           let url = URL(string: raw) {
            return url
        }
        return URL(string: "https://curi.ooo")!
    }

    private func loadURLObject(_ provider: NSItemProvider) async -> URL? {
        if provider.canLoadObject(ofClass: NSURL.self) {
            return await withCheckedContinuation { continuation in
                provider.loadObject(ofClass: NSURL.self) { obj, _ in
                    if let nsurl = obj as? NSURL {
                        continuation.resume(returning: nsurl as URL)
                    } else {
                        continuation.resume(returning: nil)
                    }
                }
            }
        }
        if provider.canLoadObject(ofClass: URL.self) {
            return await withCheckedContinuation { continuation in
                provider.loadObject(ofClass: URL.self) { obj, _ in
                    if let url = obj as? URL {
                        continuation.resume(returning: url)
                    } else {
                        continuation.resume(returning: nil)
                    }
                }
            }
        }
        return nil
    }

    private func loadStringObject(_ provider: NSItemProvider) async -> String? {
        if provider.canLoadObject(ofClass: NSString.self) {
            return await withCheckedContinuation { continuation in
                provider.loadObject(ofClass: NSString.self) { obj, _ in
                    if let ns = obj as? NSString {
                        continuation.resume(returning: ns as String)
                    } else {
                        continuation.resume(returning: nil)
                    }
                }
            }
        }
        return nil
    }
    
    override public func viewDidAppear(_ animated: Bool) {
       super.viewDidAppear(animated)
       // Do not complete the request yet; wait until after we open the Universal Link
    }
    
    private func sendData() {
        // Only share the first valid http/https URL
        let firstWebUrl = shareItems.compactMap { $0.url }
            .first(where: { value in
                guard let u = URL(string: value), let scheme = u.scheme?.lowercased() else { return false }
                return (scheme == "http" || scheme == "https")
            })

        guard let firstWebUrl else {
            // No shareable web URL found; just finish the extension silently
            print("[SendIntent][Debug] No valid http/https URL found in shareItems: \(shareItems.map { $0.url ?? "" })")
            return
        }

        // Encode inner URL similar to JS encodeURIComponent: allow only unreserved characters
        let unreserved = CharacterSet.alphanumerics.union(CharacterSet(charactersIn: "-._~"))
        let encoded = firstWebUrl.addingPercentEncoding(withAllowedCharacters: unreserved) ?? firstWebUrl

        // Universal Link only (no custom scheme)
        let base = baseURL()
        var urlComps = URLComponents()
        urlComps.scheme = base.scheme
        urlComps.host = base.host
        urlComps.port = base.port
        urlComps.path = "/"
        urlComps.percentEncodedQueryItems = [URLQueryItem(name: "url", value: encoded)]
        if let url = urlComps.url {
            print("[SendIntent][Debug] Opening Universal Link: \(url.absoluteString)")
            openURL(url)
        }
    }
    
    fileprivate func createSharedFileUrl(_ url: URL?) -> String {
        let fileManager = FileManager.default
        guard let srcUrl = url,
              let container = fileManager.containerURL(forSecurityApplicationGroupIdentifier: appGroupId)
        else { return "" }

        let dstUrl = container.appendingPathComponent(srcUrl.lastPathComponent)
        try? fileManager.copyItem(at: srcUrl, to: dstUrl)
        return dstUrl.absoluteString
    }
    
    func saveScreenshot(_ image: UIImage, _ index: Int) -> String {
        let fileManager = FileManager.default
        guard let container = fileManager.containerURL(forSecurityApplicationGroupIdentifier: appGroupId)
        else { return "" }
        let dstUrl = container.appendingPathComponent("screenshot_\(index).png")
        do {
            try image.pngData()?.write(to: dstUrl)
            return dstUrl.absoluteString
        } catch {
            print(error.localizedDescription)
            return ""
        }
    }
    
    @MainActor
    fileprivate func handleTypeUrl(_ attachment: NSItemProvider) async throws -> ShareItem {
        let shareItem = ShareItem()
        if let url = await loadURLObject(attachment) {
            print("[SendIntent][Debug] handleTypeUrl loaded URL object: \(url)")
            shareItem.title = url.absoluteString
            shareItem.url = url.absoluteString
            shareItem.type = "text/plain"
        } else if let s = await loadStringObject(attachment), let url = URL(string: s) {
            print("[SendIntent][Debug] handleTypeUrl loaded String object: \(s)")
            shareItem.title = s
            shareItem.url = s
            shareItem.type = url.isFileURL ? ("application/" + url.pathExtension.lowercased()) : "text/plain"
        }
        return shareItem
    }
    
    @MainActor
    fileprivate func handleTypeText(_ attachment: NSItemProvider) async throws -> ShareItem {
        let shareItem = ShareItem()
        if let text = await loadStringObject(attachment) {
            print("[SendIntent][Debug] handleTypeText loaded text: \(text)")
            shareItem.title = text
            shareItem.type = "text/plain"
        }
        return shareItem
    }
    
    // No-op for movies: app only needs web URLs
    
    // No-op for images: app only needs web URLs
    
    override public func viewDidLoad() {
        super.viewDidLoad()
        
        shareItems.removeAll()
        
        let extensionItem = extensionContext?.inputItems[0] as! NSExtensionItem
        Task { @MainActor in
            self.shareItems.removeAll()
            if let attachments = extensionItem.attachments {
                for attachment in attachments {
                    print("[SendIntent][Debug] Attachment registeredTypeIdentifiers: \(attachment.registeredTypeIdentifiers)")
                    print("[SendIntent][Debug] canLoad NSURL: \(attachment.canLoadObject(ofClass: NSURL.self)) canLoad NSString: \(attachment.canLoadObject(ofClass: NSString.self))")
                    if attachment.canLoadObject(ofClass: NSURL.self) || attachment.hasItemConformingToTypeIdentifier(UTType.url.identifier) {
                        if let item = try? await self.handleTypeUrl(attachment) {
                            if let s = item.url, let u = URL(string: s), let scheme = u.scheme?.lowercased(), (scheme == "http" || scheme == "https") {
                                print("[SendIntent][Debug] URL path chosen, accepted: \(s)")
                                self.shareItems.append(item)
                                break
                            }
                        }
                    } else if attachment.canLoadObject(ofClass: NSString.self) || attachment.hasItemConformingToTypeIdentifier(UTType.text.identifier) {
                        if let item = try? await self.handleTypeText(attachment) {
                            if let s = item.title, let u = URL(string: s), let scheme = u.scheme?.lowercased(), (scheme == "http" || scheme == "https") {
                                let onlyUrl = ShareItem()
                                onlyUrl.url = s
                                print("[SendIntent][Debug] Text path chosen, accepted URL: \(s)")
                                self.shareItems.append(onlyUrl)
                                break
                            }
                        }
                    }
                }
            }
            self.sendData()
        }
    }
    
    @objc func openURL(_ url: URL) {
        // Open the Universal Link and delay completion slightly to avoid immediately returning to the source app
        self.extensionContext?.open(url, completionHandler: { _ in
            DispatchQueue.main.asyncAfter(deadline: .now() + 2.0) {
                self.extensionContext?.completeRequest(returningItems: [], completionHandler: nil)
            }
        })
    }
}

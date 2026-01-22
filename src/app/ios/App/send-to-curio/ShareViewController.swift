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
    private let appGroupId = "group.ooo.curi.app"

    private func baseURL() -> URL {
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
    }
    
    private func sendData() {
        let firstWebUrl = shareItems.compactMap { $0.url }
            .first(where: { value in
                guard let u = URL(string: value), let scheme = u.scheme?.lowercased() else { return false }
                return (scheme == "http" || scheme == "https")
            })

        guard let firstWebUrl else {
            NSLog("[SendIntent][Debug] No valid http/https URL found in shareItems: %@", shareItems.map { $0.url ?? "" })
            return
        }

        // Use custom URL scheme for robustness when opening from extension
        var urlComps = URLComponents()
        urlComps.scheme = "ooo.curi.app"
        urlComps.host = ""
        urlComps.path = "/"
        urlComps.queryItems = [URLQueryItem(name: "url", value: firstWebUrl)]
        
        if let url = urlComps.url {
            NSLog("[SendIntent][Debug] Opening Custom Scheme Link: %@", url.absoluteString)
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
            NSLog("[SendIntent][Debug] Error saving screenshot: %@", error.localizedDescription)
            return ""
        }
    }
    
    @MainActor
    fileprivate func handleTypeUrl(_ attachment: NSItemProvider) async throws -> ShareItem {
        let shareItem = ShareItem()
        if let url = await loadURLObject(attachment) {
            NSLog("[SendIntent][Debug] handleTypeUrl loaded URL object: %@", url.absoluteString)
            shareItem.title = url.absoluteString
            shareItem.url = url.absoluteString
            shareItem.type = "text/plain"
        } else if let s = await loadStringObject(attachment), let url = URL(string: s) {
            NSLog("[SendIntent][Debug] handleTypeUrl loaded String object: %@", s)
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
            NSLog("[SendIntent][Debug] handleTypeText loaded text: %@", text)
            shareItem.title = text
            shareItem.type = "text/plain"
        }
        return shareItem
    }
    
    override public func viewDidLoad() {
        super.viewDidLoad()
        
        shareItems.removeAll()
        
        guard let extensionItem = extensionContext?.inputItems.first as? NSExtensionItem else {
            NSLog("[SendIntent][Debug] No input items found")
            return
        }

        Task { @MainActor in
            self.shareItems.removeAll()
            if let attachments = extensionItem.attachments {
                for attachment in attachments {
                    NSLog("[SendIntent][Debug] Attachment registeredTypeIdentifiers: %@", attachment.registeredTypeIdentifiers)
                    NSLog("[SendIntent][Debug] canLoad NSURL: %d canLoad NSString: %d", attachment.canLoadObject(ofClass: NSURL.self) ? 1 : 0, attachment.canLoadObject(ofClass: NSString.self) ? 1 : 0)
                    if attachment.canLoadObject(ofClass: NSURL.self) || attachment.hasItemConformingToTypeIdentifier(UTType.url.identifier) {
                        if let item = try? await self.handleTypeUrl(attachment) {
                            if let s = item.url, let u = URL(string: s), let scheme = u.scheme?.lowercased(), (scheme == "http" || scheme == "https") {
                                NSLog("[SendIntent][Debug] URL path chosen, accepted: %@", s)
                                self.shareItems.append(item)
                                break
                            }
                        }
                    } else if attachment.canLoadObject(ofClass: NSString.self) || attachment.hasItemConformingToTypeIdentifier(UTType.text.identifier) {
                        if let item = try? await self.handleTypeText(attachment) {
                            if let s = item.title, let u = URL(string: s), let scheme = u.scheme?.lowercased(), (scheme == "http" || scheme == "https") {
                                let onlyUrl = ShareItem()
                                onlyUrl.url = s
                                NSLog("[SendIntent][Debug] Text path chosen, accepted URL: %@", s)
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
        // Use responder chain to find an object that can open the URL (recommended for extensions)
        var responder: UIResponder? = self
        while responder != nil {
            if let application = responder as? UIApplication {
                application.open(url, options: [:], completionHandler: { _ in
                    self.extensionContext?.completeRequest(returningItems: [], completionHandler: nil)
                })
                return
            }
            responder = responder?.next
        }
        
        // Fallback to extensionContext.open if responder chain fails
        self.extensionContext?.open(url, completionHandler: { _ in
            DispatchQueue.main.asyncAfter(deadline: .now() + 2.0) {
                self.extensionContext?.completeRequest(returningItems: [], completionHandler: nil)
            }
        })
    }
}

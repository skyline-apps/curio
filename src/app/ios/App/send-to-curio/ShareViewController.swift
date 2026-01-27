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
            DispatchQueue.main.async {
                self.statusLabel.text = "No valid URL found"
                DispatchQueue.main.asyncAfter(deadline: .now() + 1.0) {
                    self.extensionContext?.completeRequest(returningItems: [], completionHandler: nil)
                }
            }
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
    
    private let statusLabel = UILabel()

    override public func viewDidLoad() {
        super.viewDidLoad()
        
        // Add visual feedback (Spinner & Status Label)
        let spinner = UIActivityIndicatorView(style: .large)
        spinner.color = .white
        spinner.translatesAutoresizingMaskIntoConstraints = false
        spinner.startAnimating()
        
        statusLabel.textColor = .white
        statusLabel.textAlignment = .center
        statusLabel.numberOfLines = 0
        statusLabel.font = UIFont.systemFont(ofSize: 14)
        statusLabel.translatesAutoresizingMaskIntoConstraints = false
        statusLabel.text = "Initializing..."
        
        view.addSubview(spinner)
        view.addSubview(statusLabel)
        view.backgroundColor = UIColor.black.withAlphaComponent(0.8)
        
        NSLayoutConstraint.activate([
            spinner.centerXAnchor.constraint(equalTo: view.centerXAnchor),
            spinner.centerYAnchor.constraint(equalTo: view.centerYAnchor, constant: -20),
            statusLabel.topAnchor.constraint(equalTo: spinner.bottomAnchor, constant: 20),
            statusLabel.leadingAnchor.constraint(equalTo: view.leadingAnchor, constant: 20),
            statusLabel.trailingAnchor.constraint(equalTo: view.trailingAnchor, constant: -20)
        ])
        
        func updateStatus(_ msg: String, _ userFacing: String? = nil) {
            DispatchQueue.main.async {
                if let userMsg = userFacing {
                    self.statusLabel.text = userMsg
                }
                NSLog("[SendIntent] %@", msg)
            }
        }
        
        updateStatus("Starting Watchdog (4s)...", nil)
        // Watchdog: If nothing happens in 4 seconds, force close to prevent freeze
        DispatchQueue.main.asyncAfter(deadline: .now() + 4.0) {
            updateStatus("Watchdog timeout! Closing...", "Request timed out")
            DispatchQueue.main.asyncAfter(deadline: .now() + 1.0) {
                self.extensionContext?.completeRequest(returningItems: [], completionHandler: nil)
            }
        }
        
        shareItems.removeAll()
        
        guard let extensionItem = extensionContext?.inputItems.first as? NSExtensionItem else {
            updateStatus("Error: No input items", "No content found")
            DispatchQueue.main.asyncAfter(deadline: .now() + 1.0) {
                self.extensionContext?.completeRequest(returningItems: [], completionHandler: nil)
            }
            return
        }

        Task { @MainActor in
            updateStatus("Processing attachments...", "Processing...")
            self.shareItems.removeAll()
            if let attachments = extensionItem.attachments {
                for attachment in attachments {
                    // ... (existing logic)
                    if attachment.canLoadObject(ofClass: NSURL.self) || attachment.hasItemConformingToTypeIdentifier(UTType.url.identifier) {
                        updateStatus("Found URL item...", nil)
                        if let item = try? await self.handleTypeUrl(attachment) {
                            if let s = item.url, let u = URL(string: s), let scheme = u.scheme?.lowercased(), (scheme == "http" || scheme == "https") {
                                updateStatus("Accepted URL: \(s)", "Found link")
                                self.shareItems.append(item)
                                break
                            }
                        }
                    } else if attachment.canLoadObject(ofClass: NSString.self) || attachment.hasItemConformingToTypeIdentifier(UTType.text.identifier) {
                        updateStatus("Found Text item...", nil)
                        if let item = try? await self.handleTypeText(attachment) {
                            if let s = item.title, let u = URL(string: s), let scheme = u.scheme?.lowercased(), (scheme == "http" || scheme == "https") {
                                let onlyUrl = ShareItem()
                                onlyUrl.url = s
                                updateStatus("Accepted Text URL: \(s)", "Found link")
                                self.shareItems.append(onlyUrl)
                                break
                            }
                        }
                    }
                }
            }
            updateStatus("Sending data...", "Opening...")
            self.sendData()
        }
    }

    @objc func openURL(_ url: URL) {
        DispatchQueue.main.async {
            self.statusLabel.text = "Opening Curio..."
            NSLog("[SendIntent] Opening URL: %@", url.absoluteString)
        }
        
        // 1. Try Responder Chain (UIApplication)
        var responder: UIResponder? = self
        while responder != nil {
            if let application = responder as? UIApplication {
                DispatchQueue.main.async {
                    NSLog("[SendIntent] Found UIApplication. Opening...")
                }
                application.open(url, options: [:], completionHandler: { success in
                    DispatchQueue.main.async {
                        self.statusLabel.text = success ? "Success" : "Failed to open"
                        NSLog("[SendIntent] App open result: %d", success)
                        DispatchQueue.main.asyncAfter(deadline: .now() + 1.0) {
                            self.extensionContext?.completeRequest(returningItems: [], completionHandler: nil)
                        }
                    }
                })
                return
            }
            responder = responder?.next
        }
        
        // 2. Fallback to ExtensionContext
        DispatchQueue.main.async {
            NSLog("[SendIntent] No UIApplication found. Using ExtensionContext...")
        }
        self.extensionContext?.open(url, completionHandler: { success in
            DispatchQueue.main.async {
                self.statusLabel.text = success ? "Success" : "Failed to open"
                NSLog("[SendIntent] Context open result: %d", success)
                DispatchQueue.main.asyncAfter(deadline: .now() + 1.0) {
                    self.extensionContext?.completeRequest(returningItems: [], completionHandler: nil)
                }
            }
        })
    }
}

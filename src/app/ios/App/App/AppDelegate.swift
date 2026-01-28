import UIKit
import Capacitor
import MindlibCapacitorSendIntent

@UIApplicationMain
class AppDelegate: UIResponder, UIApplicationDelegate {

    var window: UIWindow?
    
    let store = ShareStore.store

    func application(_ application: UIApplication, didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?) -> Bool {
        // Override point for customization after application launch.
        return true
    }

    func applicationWillResignActive(_ application: UIApplication) {
        // Sent when the application is about to move from active to inactive state. This can occur for certain types of temporary interruptions (such as an incoming phone call or SMS message) or when the user quits the application and it begins the transition to the background state.
        // Use this method to pause ongoing tasks, disable timers, and invalidate graphics rendering callbacks. Games should use this method to pause the game.
    }

    func applicationDidEnterBackground(_ application: UIApplication) {
        // Use this method to release shared resources, save user data, invalidate timers, and store enough application state information to restore your application to its current state in case it is terminated later.
        // If your application supports background execution, this method is called instead of applicationWillTerminate: when the user quits.
    }

    func applicationWillEnterForeground(_ application: UIApplication) {
        // Called as part of the transition from the background to the active state; here you can undo many of the changes made on entering the background.
    }

    func applicationDidBecomeActive(_ application: UIApplication) {
        // Restart any tasks that were paused (or not yet started) while the application was inactive. If the application was previously in the background, optionally refresh the user interface.
    }

    func applicationWillTerminate(_ application: UIApplication) {
        // Called when the application is about to terminate. Save data if appropriate. See also applicationDidEnterBackground:.
    }

    func application(_ app: UIApplication, open url: URL, options: [UIApplication.OpenURLOptionsKey : Any] = [:]) -> Bool {
                
        var success = true
        if CAPBridge.handleOpenUrl(url, options) {
            success = ApplicationDelegateProxy.shared.application(app, open: url, options: options)
        }
        
        guard let components = NSURLComponents(url: url, resolvingAgainstBaseURL: true),
              let params = components.queryItems else {
                  return false
              }
        let titles = params.filter { $0.name == "title" }
        let descriptions = params.filter { $0.name == "description" }
        let types = params.filter { $0.name == "type" }
        let urls = params.filter { $0.name == "url" }

        store.shareItems.removeAll()
        if titles.count > 0 {
            for index in 0...titles.count-1 {
                var shareItem: JSObject = JSObject()
                shareItem["title"] = titles[index].value ?? ""
                shareItem["description"] = index < descriptions.count ? (descriptions[index].value ?? "") : ""
                shareItem["type"] = index < types.count ? (types[index].value ?? "") : ""
                shareItem["url"] = index < urls.count ? (urls[index].value ?? "") : ""
                store.shareItems.append(shareItem)
            }
        } else if urls.count > 0 {
            // Support only 'url' param present
            var shareItem: JSObject = JSObject()
            shareItem["url"] = urls[0].value ?? ""
            store.shareItems.append(shareItem)
        }
        
        store.processed = false
        let nc = NotificationCenter.default
        nc.post(name: Notification.Name("triggerSendIntent"), object: nil )
        
        return success
    }

    func application(_ application: UIApplication, continue userActivity: NSUserActivity, restorationHandler: @escaping ([UIUserActivityRestoring]?) -> Void) -> Bool {
        // Handle Universal Links by extracting the share payload from the query
        var handled = ApplicationDelegateProxy.shared.application(application, continue: userActivity, restorationHandler: restorationHandler)
        if userActivity.activityType == NSUserActivityTypeBrowsingWeb,
           let url = userActivity.webpageURL,
           let components = NSURLComponents(url: url, resolvingAgainstBaseURL: true),
           let params = components.queryItems {

            // Accept any path as long as it contains a 'url' query item (or legacy title/text params)
            let titles = params.filter { $0.name == "title" }
            let descriptions = params.filter { $0.name == "description" }
            let types = params.filter { $0.name == "type" }
            let urls = params.filter { $0.name == "url" }

            store.shareItems.removeAll()
            if urls.count > 0 {
                var shareItem: JSObject = JSObject()
                shareItem["url"] = urls[0].value ?? ""
                store.shareItems.append(shareItem)
                store.processed = false
                NotificationCenter.default.post(name: Notification.Name("triggerSendIntent"), object: nil)
                handled = true
            } else if titles.count > 0 {
                for index in 0...titles.count-1 {
                    var shareItem: JSObject = JSObject()
                    shareItem["title"] = titles[index].value ?? ""
                    shareItem["description"] = index < descriptions.count ? (descriptions[index].value ?? "") : ""
                    shareItem["type"] = index < types.count ? (types[index].value ?? "") : ""
                    shareItem["url"] = index < urls.count ? (urls[index].value ?? "") : ""
                    store.shareItems.append(shareItem)
                }
                store.processed = false
                NotificationCenter.default.post(name: Notification.Name("triggerSendIntent"), object: nil)
                handled = true
            }
        }
        return handled
    }

    override func buildMenu(with builder: UIMenuBuilder) {
        if builder.system == UIMenuSystem.context {
            let explain = UICommand(title: "Explain", action: #selector(explainText))
            let explainMenu = UIMenu(title: "", options: .displayInline, children: [explain])
            builder.insertChild(explainMenu, atStartOfMenu: .root)
            
            let canHighlight = UserDefaults.standard.string(forKey: "CapacitorStorage.canHighlight")
            if canHighlight == "true" {
                let highlight = UICommand(title: "Highlight", action: #selector(highlightText))
                let highlightMenu = UIMenu(title: "", options: .displayInline, children: [highlight])
                builder.insertChild(highlightMenu, atStartOfMenu: .root)
            }
        }
        super.buildMenu(with: builder)
    }

    @objc func explainText() {
        if let bridgeVC = self.window?.rootViewController as? CAPBridgeViewController {
            bridgeVC.webView?.evaluateJavaScript("window.dispatchEvent(new CustomEvent('native-action-explain'))")
        }
    }

    @objc func highlightText() {
        if let bridgeVC = self.window?.rootViewController as? CAPBridgeViewController {
            bridgeVC.webView?.evaluateJavaScript("window.dispatchEvent(new CustomEvent('native-action-highlight'))")
        }
    }

}

import Foundation

@objc public class MuxPlayer: NSObject {
    @objc public func echo(_ value: String) -> String {
        print(value)
        return value
    }
}

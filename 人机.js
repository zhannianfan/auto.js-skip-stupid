
/**
 * 安卓7+机器人
 */
function 通用机器人(最大重试次数) {
    this.最大重试次数 = 最大重试次数;

    this.点击 = function (x坐标, y坐标) {
        log(`🖱️ 通用机器人: 点击坐标 (${x坐标}, ${y坐标})`);
        return click(x坐标, y坐标);
    };

    this.滑动 = function (起点x, 起点y, 终点x, 终点y, 持续时间) {
        持续时间 = 持续时间 || 50;
        log(`🔄 通用机器人: 滑动从 (${起点x}, ${起点y}) 到 (${终点x}, ${终点y}) 持续 ${持续时间}ms`);
        return swipe(起点x, 起点y, 终点x, 终点y, 持续时间);
    };

    this.同时点击多点 = function (点数组) {
        log(`👆 通用机器人: 同时点击 ${点数组.length} 个点`);
        let 手势列表 = [];
        let 手势时长 = 1;
        let 最大点数 = 10; // 最多触摸点数
        
        点数组.forEach(function (点) {
            手势列表.push([0, 手势时长, 点]);
        });

        // 同时点击多个点
        let 分块列表 = 手势列表.分块(最大点数); // 太多点则分成多段
        log(`📦 将手势分成 ${分块列表.length} 块执行`);
        分块列表.forEach(function (块, 索引) {
            log(`🎯 执行第 ${索引 + 1} 块手势，包含 ${块.length} 个点`);
            gestures.apply(null, 块);
        });
    };

    this.等待可用 = function () {
        log(`🔍 检查无障碍服务是否可用`);
        // 检查无障碍是否可用（根据控件）
        for (let 尝试次数 = 0; 尝试次数 < this.最大重试次数; 尝试次数++) {
            if (selector().findOnce()) {
                log(`✅ 无障碍服务可用`);
                return;
            }
            log(`🔄 #${尝试次数 + 1} 尝试重启无障碍服务`);
            auto.stop();
            auto.waitFor(1000);
            sleep(1000);
        }
        
        log(`❌ 无障碍服务故障，退出脚本`);
        exit();
    };

    this.启用工作资料 = function (开关状态) {
        log(`👔 ${开关状态 ? '启用' : '禁用'}工作资料`);
        quickSettings();
        sleep(1000);
        
        let 工作应用按钮 = desc("工作应用").findOnce();
        if (!工作应用按钮) {
            log(`❌ 未找到工作应用按钮`);
            exit();
        }
        
        let 当前状态 = 工作应用按钮.checked();
        let 需要切换 = 开关状态 ^ 当前状态; // 异或
        
        if (需要切换) {
            log(`🔄 切换工作资料状态: ${当前状态 ? '开->关' : '关->开'}`);
            工作应用按钮.click();
            sleep(4000);
        } else {
            log(`ℹ️ 工作资料已经是目标状态，无需切换`);
        }
        
        back();
        sleep(500);
        back();
        sleep(500);
        log(`✅ 工作资料设置完成`);
    };
}

/**
 * 机器人工厂
 * @param {int} 最大重试次数 最大尝试次数
 */
function 机器人(最大重试次数) {
    最大重试次数 = 最大重试次数 || 3;
    log(`🤖 创建机器人实例，SDK版本: ${device.sdkInt}`);
    this.具体机器人 = (device.sdkInt < 24) ? new 安卓5机器人(最大重试次数) : new 通用机器人(最大重试次数);



    this.点击 = function (x坐标, y坐标) {
        return this.具体机器人.点击(x坐标, y坐标);
    };

    this.点击中心 = function (控件对象) {
        log(`🎯 点击控件中心位置`);
        let 边界矩形 = 控件对象.bounds();
        let 中心x = 边界矩形.centerX();
        let 中心y = 边界矩形.centerY();
        log(`📍 控件中心坐标: (${中心x}, ${中心y})`);
        return this.具体机器人.点击(中心x, 中心y);
    };

    this.滑动 = function (起点x, 起点y, 终点x, 终点y, 持续时间) {
        log(`🔄 执行滑动操作`);
        this.具体机器人.滑动(起点x, 起点y, 终点x, 终点y, 持续时间);
    };

    this.返回 = function () {
        log(`↩️ 执行返回操作`);
        back();
    };

    this.强制停止应用 = function (包名) {
        log(`🛑 强制停止应用: ${包名}`);
        shell("am force-stop " + 包名, true);
    };

    this.关闭应用 = function () {
        log(`📱 关闭当前应用`);
        recents();
        sleep(1500);
        
        let 中心x = device.width >> 1;
        let 终点y = device.height >> 2;
        let 起点y = device.height - 终点y;
        
        log(`🎯 滑动关闭应用: 从 (${中心x}, ${起点y}) 到 (${中心x}, ${终点y})`);
        gesture(200, [中心x, 起点y], [中心x, 终点y]);
        sleep(800);
        home();
        log(`✅ 应用关闭完成`);
    };

    this.点击多个点 = function (点数组) {
        log(`👆 依次点击 ${点数组.length} 个点`);
        点数组.forEach(function (点, 索引) {
            log(`📍 点击第 ${索引 + 1} 个点: (${点[0]}, ${点[1]})`);
            this.具体机器人.点击(点[0], 点[1]);
        }.bind(this));
    };

    this.点击多个控件中心 = function (控件集合) {
        log(`🎯 点击 ${控件集合.length} 个控件的中心点`);
        let 点数组 = [];
        控件集合.forEach(function(控件对象, 索引) {
            let 边界矩形 = 控件对象.bounds();
            let 中心点 = [边界矩形.centerX(), 边界矩形.centerY()];
            点数组.push(中心点);
            log(`📍 第 ${索引 + 1} 个控件中心: (${中心点[0]}, ${中心点[1]})`);
        });
        this.点击多个点(点数组);
    };
    
    this.同时点击多个点 = function (点数组) {
        log(`⚡ 同时点击 ${点数组.length} 个点`);
        return this.具体机器人.同时点击多点(点数组);
    };

    this.等待可用 = function () {
        log(`⏳ 等待机器人可用`);
        this.具体机器人.等待可用();
    };

    this.启用工作资料 = function (开关状态) {
        log(`👔 设置工作资料: ${开关状态 ? '启用' : '禁用'}`);
        this.具体机器人.启用工作资料(开关状态);
    };
}

module.exports = 机器人;

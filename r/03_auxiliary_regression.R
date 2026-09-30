# 補助回帰・地域差 / Auxiliary regression and group differences
# 教育年数・所得を題材とする説明用の生成データ。
# SETTINGS_BEGIN
n_group <- 80L          # 各地域の人数。総標本数Nはこの2倍
delta <- 2             # 地域BとAの教育年数の平均差
beta <- 20             # 同じ地域内での教育年数1年に対応する所得差
gamma <- 80            # 教育年数が同じときの地域BとAの所得差
sigma_v <- 1           # 地域内の教育年数の標準偏差
sigma_u <- 15          # 所得の誤差の標準偏差
B <- 300L              # 標本を作り直す回数
seed <- 102L           # 講義スライドと同じ乱数シード
# SETTINGS_END

if (is.finite(sigma_v) && sigma_v == 0)
  stop("sigma_v=0では地域内でdが一定となり，betaの推定に使う変動がない。正の値を指定する。")
stopifnot(n_group >= 3, n_group == as.integer(n_group), B >= 2, B == as.integer(B),
          all(is.finite(c(delta, beta, gamma, sigma_v, sigma_u))),
          sigma_v > 0, sigma_u >= 0)
if (2 * n_group * B > 2e6) stop("2 × n_group × B は 2,000,000 以下に設定する。")
set.seed(seed)

# 1. 確率モデル。各地域の人数は固定し，vとuを独立に生成する。
# 母集団で各地域の比率は1/2。繰り返す標本でも各地域から同数を抽出する。
# x_i = (1, d_i, a_i) は行ベクトル，係数 (100, beta, gamma)' は列ベクトル。
draw_sample <- function() {
  a <- rep(0:1, each = n_group)
  v <- rnorm(length(a), sd = sigma_v)
  u <- rnorm(length(a), sd = sigma_u)
  d <- 12 + delta * a + v
  y <- 100 + beta * d + gamma * a + u
  data.frame(a = a, v = v, u = u, d = d, y = y)
}
dat <- draw_sample()

# 2. 地域を区別しない単回帰と，地域を加えた重回帰
raw <- lm(y ~ d, data = dat)
full <- lm(y ~ d + a, data = dat)

# 3. 二つの補助回帰。定数項と二値変数aへの回帰残差は地域平均との差である。
dat$dr <- resid(lm(d ~ a, data = dat))
dat$yr <- resid(lm(y ~ a, data = dat))
auxiliary <- lm(yr ~ 0 + dr, data = dat)
groups <- aggregate(cbind(d, y) ~ a, data = dat, FUN = mean)
names(groups) <- c("a", "d_mean", "y_mean")
stopifnot(max(abs(dat$dr - (dat$d - groups$d_mean[dat$a + 1]))) < 1e-8,
          max(abs(dat$yr - (dat$y - groups$y_mean[dat$a + 1]))) < 1e-8,
          abs(coef(full)["d"] - coef(auxiliary)["dr"]) < 1e-8)

# 4. 反復実験。同じ生成式で，個人のvとuを毎回生成し直す。
estimates <- replicate(B, {
  dd <- draw_sample()
  c(raw = unname(coef(lm(y ~ d, data = dd))["d"]),
    full = unname(coef(lm(y ~ d + a, data = dd))["d"]))
})
# 等比率の母集団で Cov(d,a)=delta/4，Var(d)=sigma_v^2+delta^2/4。
# 地域を省いた単回帰の母集団係数は，betaに以下の項を加えた値になる。
raw_target <- beta + gamma * (delta / 4) / (sigma_v^2 + delta^2 / 4)

# 5. 図：地域間の違い → 同じ地域内の違い → 反復による係数の変動
blue <- "#005A85"; orange <- "#B45A20"; ink <- "#182632"
cols <- c(blue, orange)[dat$a + 1]
pchs <- c(16, 17)[dat$a + 1]
par(family = getOption("econometrics.font", "sans"), mar = c(4.5, 4.8, 3, 1.2), mgp = c(2.9, .8, 0),
    col = ink, col.axis = ink, col.lab = ink, fg = ink, las = 1, bty = "l")
plot(dat$d, dat$y, pch = pchs, col = adjustcolor(cols, .55),
     xlab = "教育年数 d（年）", ylab = "年間所得 y（万円）",
     main = "二つの地域・全体の単回帰")
abline(100, beta, col = blue, lwd = 2)
abline(100 + gamma, beta, col = orange, lwd = 2)
abline(raw, col = ink, lwd = 2, lty = 2)
legend("topleft", c("地域A：a = 0", "地域B：a = 1", "全体の単回帰"),
       col = c(blue, orange, ink), pch = c(16, 17, NA), lty = c(1, 1, 2),
       lwd = 2, bty = "n", cex = .95, y.intersp = 1.2)

# 左右の横軸・縦軸それぞれの幅をそろえ，同じ人の移動を比較する。
selected <- c(which(dat$a == 0)[which.min(abs(dat$dr[dat$a == 0] - 1.4 * sigma_v))],
              which(dat$a == 1)[which.min(abs(dat$dr[dat$a == 1] + 1.4 * sigma_v))])
cx <- mean(range(dat$d)); cy <- mean(range(dat$y))
hx <- max(diff(range(dat$d)) / 2, abs(dat$dr), .1) * 1.35
hy <- max(diff(range(dat$y)) / 2, abs(dat$yr), 1) * 1.5
par(mfrow = c(1, 2), mar = c(4.5, 4.5, 3, .7), cex = .84)
for (centered in c(FALSE, TRUE)) {
  xx <- if (centered) dat$dr else dat$d
  yy <- if (centered) dat$yr else dat$y
  plot(xx, yy, pch = pchs, col = adjustcolor(cols, .48), cex = .8,
       xlim = (if (centered) 0 else cx) + c(-hx, hx),
       ylim = (if (centered) 0 else cy) + c(-hy, hy),
       xlab = if (centered) expression(tilde(d)[i]~"（年）") else "教育年数 d（年）",
       ylab = if (centered) expression(tilde(y)[i]~"（万円）") else "年間所得 y（万円）",
       main = if (centered) "地域平均との差" else "本人の値")
  if (centered) {
    abline(h = 0, v = 0, col = "#BCCED8", lty = 3)
    abline(0, coef(auxiliary)[1], col = ink, lwd = 2)
    points(0, 0, pch = 23, bg = "white", cex = 1.4)
  } else {
    points(groups$d_mean, groups$y_mean, pch = 23, bg = "white", col = c(blue, orange), cex = 1.4)
  }
  for (j in seq_along(selected)) {
    k <- selected[j]; g <- dat$a[k] + 1
    arrows(if (centered) 0 else groups$d_mean[g], if (centered) 0 else groups$y_mean[g],
           xx[k], yy[k], length = .08, col = cols[k], lwd = 2)
    points(xx[k], yy[k], pch = 21, bg = "white", col = cols[k], cex = 1.2, lwd = 2)
    text(xx[k], yy[k], c("地域Aの1人", "地域Bの1人")[j],
         pos = if (j == 1) 3 else 1, col = cols[k], cex = .9)
  }
  legend("topleft", c("地域A", "地域B", "地域の平均点"),
         pch = c(16, 17, 23), pt.bg = "white", col = c(blue, orange, ink), bty = "n", cex = .95, y.intersp = 1.2)
}

par(mfrow = c(1, 1), cex = 1, mar = c(4.5, 4.8, 3, 1.2))
limits <- range(estimates, beta, raw_target)
if (diff(limits) < 1e-8) limits <- limits + c(-1, 1)
breaks <- seq(limits[1] - .04 * diff(limits), limits[2] + .04 * diff(limits), length.out = 45)
h_raw <- hist(estimates["raw", ], breaks = breaks, plot = FALSE)
h_full <- hist(estimates["full", ], breaks = breaks, plot = FALSE)
plot(h_raw, freq = FALSE, col = adjustcolor(orange, .5), border = "white",
     ylim = c(0, max(h_raw$density, h_full$density) * 1.3),
     main = sprintf("同じ確率モデルから得る%d組の係数", B),
     xlab = "教育年数の係数（万円／年）", ylab = "密度")
plot(h_full, freq = FALSE, col = adjustcolor(blue, .5), border = "white", add = TRUE)
abline(v = raw_target, col = orange, lty = 2, lwd = 2)
abline(v = beta, col = blue, lty = 2, lwd = 2)
legend("topright", c("単回帰の推定値", "重回帰の推定値", "単回帰の母集団係数", "生成式の係数 beta"),
       col = c(orange, blue, orange, blue), pch = c(15, 15, NA, NA), pt.cex = 1.4,
       lty = c(NA, NA, 2, 2), lwd = 2,
       bty = "n", cex = .95, y.intersp = 1.2)

result <- list(
  settings = data.frame(setting = c("n_group", "N", "delta", "beta", "gamma", "sigma_v", "sigma_u", "B", "seed"),
                        value = c(n_group, 2 * n_group, delta, beta, gamma, sigma_v, sigma_u, B, seed)),
  model = c("a = 0 or 1; n_group observations per region",
            "v ~ N(0, sigma_v^2), u ~ N(0, sigma_u^2); independent",
            "d = 12 + delta * a + v", "y = 100 + beta * d + gamma * a + u"),
  metrics = data.frame(
    key = c("raw", "full", "auxiliary", "true_beta", "raw_target", "fwl_gap", "mc_raw", "mc_full", "mc_raw_sd", "mc_full_sd"),
    label = c("この標本の単回帰係数", "この標本の重回帰係数", "この標本の補助回帰による係数",
              "生成式の係数 beta", "単回帰の母集団係数", "重回帰・補助回帰の差",
              "単回帰係数の反復平均", "重回帰係数の反復平均", "単回帰係数の反復標準偏差", "重回帰係数の反復標準偏差"),
    value = c(unname(coef(raw)["d"]), unname(coef(full)["d"]), unname(coef(auxiliary)["dr"]),
              beta, raw_target, unname(coef(full)["d"] - coef(auxiliary)["dr"]),
              mean(estimates["raw", ]), mean(estimates["full", ]),
              sd(estimates["raw", ]), sd(estimates["full", ]))),
  data = data.frame(i = seq_len(nrow(dat)), dat),
  repetitions = data.frame(b = seq_len(B), raw = estimates["raw", ], full = estimates["full", ]),
  groups = groups,
  plot_titles = c("1人ずつの教育年数と所得", "同じ人の値・地域平均との差", "調査ごとに推定した教育年数の係数"),
  plot_notes = c(
    sprintf("各地域%d人・合計%d人の標本。青い丸は地域Aの1人，橙の三角は地域Bの1人。青・橙の実線は各地域の生成式で決まる平均所得。黒い破線は二つの地域をまとめて推定した単回帰の直線。", n_group, 2 * n_group),
    "左右で同じ人を示す。左は本人の教育年数と所得，右は本人の値から地域の標本平均を引いた値。青い丸は地域A，橙の三角は地域B。白抜きの丸は各地域から選んだ1人，菱形は地域の標本平均。矢印は地域の標本平均から本人までの差。右の黒線は所得の平均との差を教育年数の平均との差に回帰した直線。",
    sprintf("各地域%d人の調査を%d回繰り返し，各回で係数を求めた分布。橙の棒は単回帰，青い棒は地域を説明変数に加えた重回帰。橙の破線は単回帰の母集団係数，青い破線は生成式の係数β。縦軸は密度で，棒の面積が各区間の割合を表す。", n_group, B))
)
print(result$metrics[, c("label", "value")], row.names = FALSE)
invisible(result)

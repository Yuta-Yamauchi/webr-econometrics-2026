# 母集団・標本分布 / Population and sampling distributions
# 説明用の生成データ。追加パッケージを使わず，WebRと通常のRで実行できる。
# SETTINGS_BEGIN
N <- 25L                 # 一つの標本に含める観測数 / sample size
B <- 1000L               # 標本を作り直す回数 / Monte Carlo replications
mu <- 400                # 母平均（万円） / population mean
sigma <- 100             # 母標準偏差（万円） / population standard deviation
distribution <- "exponential"  # "normal", "exponential", "uniform"
seed <- 2026L            # 同じ設定・同じシードで同じ結果
# SETTINGS_END

stopifnot(N >= 2, N == as.integer(N), B >= 2, B == as.integer(B),
          is.finite(mu), is.finite(sigma), sigma > 0,
          distribution %in% c("normal", "exponential", "uniform"))
if (N * B > 5e6) stop("N × B は 5,000,000 以下に設定する。")
set.seed(seed)

# 1. 母集団の確率分布
# zの平均を0・分散を1にそろえる。分布を変えてもmuとsigmaは同じ意味を持つ。
draw_y <- function(n) {
  z <- switch(distribution,
    normal = rnorm(n),
    exponential = rexp(n) - 1,
    uniform = runif(n, -sqrt(3), sqrt(3)))
  mu + sigma * z
}
population_density <- function(y) {
  z <- (y - mu) / sigma
  switch(distribution,
    normal = dnorm(z),
    exponential = dexp(z + 1),
    uniform = dunif(z, -sqrt(3), sqrt(3))) / sigma
}

# 2. 一つの標本：N個の観測値から平均を一つ計算する。
y <- draw_y(N)
y_bar <- mean(y)

# 3. 同じ抽出・計算をB回反復する。各回がそれぞれN個の新しい観測値を持つ。
# 最初の標本yは上の表示用標本であり，以下のB標本とは別に生成する。
means <- replicate(B, mean(draw_y(N)))
standard_error <- sigma / sqrt(N)
standardized <- sqrt(N) * (means - mu) / sigma

# 4. 図：個々の観測値 → 標本平均 → 中心化・拡大した標本平均
blue <- "#005A85"; orange <- "#B45A20"; ink <- "#182632"
par(family = getOption("econometrics.font", "sans"), mar = c(5.5, 6, 3, 1.2), mgp = c(3.8, .8, 0),
    col = ink, col.axis = ink, col.lab = ink, fg = ink, las = 1, bty = "l")
limits <- range(y, mu + sigma * c(-4, 7))
if (distribution != "exponential") limits <- range(y, mu + sigma * c(-4, 4))
xx <- seq(limits[1], limits[2], length.out = 1400)
hh <- hist(y, breaks = "FD", plot = FALSE)
plot(hh, freq = FALSE, col = "#D9E8EF", border = "white", xlim = limits,
     ylim = c(0, max(hh$density, population_density(xx)) * 1.18),
     main = sprintf("一つの標本：%d個の観測値", N),
     xlab = "年間所得（万円）", ylab = "密度")
lines(xx, population_density(xx), col = blue, lwd = 2.5)
abline(v = mu, col = ink, lwd = 2, lty = 2)
abline(v = y_bar, col = orange, lwd = 2)
legend("topright", c("母集団の密度", "母平均", "この標本の平均"),
       col = c(blue, ink, orange), lty = c(1, 2, 1), lwd = 2, bty = "n", cex = .9)

normal_label <- if (distribution == "normal") "標本平均の正規密度" else "正規近似の密度"
hh <- hist(means, breaks = "FD", plot = FALSE)
limits <- range(means, mu + c(-4, 4) * standard_error)
xx <- seq(limits[1], limits[2], length.out = 1000)
plot(hh, freq = FALSE, col = "#D9E8EF", border = "white", xlim = limits,
     ylim = c(0, max(hh$density, dnorm(xx, mu, standard_error)) * 1.18),
     main = sprintf("標本平均の分布：%d標本の平均", B),
     xlab = "各調査の平均所得（万円）", ylab = "密度")
lines(xx, dnorm(xx, mu, standard_error), col = orange, lwd = 2.5)
abline(v = mu, col = ink, lty = 2, lwd = 2)
legend("topright", c(normal_label, "母平均"), col = c(orange, ink),
       lty = c(1, 2), lwd = 2, bty = "n", cex = .9)

hh <- hist(standardized, breaks = "FD", plot = FALSE)
limits <- range(standardized, c(-4, 4))
xx <- seq(limits[1], limits[2], length.out = 1000)
plot(hh, freq = FALSE, col = "#D9E8EF", border = "white", xlim = limits,
     ylim = c(0, max(hh$density, dnorm(xx)) * 1.18),
     main = "中心化・拡大した標本平均の分布",
     xlab = expression(sqrt(N) * (bar(y)[N] - mu) / sigma), ylab = "密度")
lines(xx, dnorm(xx), col = orange, lwd = 2.5)
legend("topright", "標準正規密度", col = orange, lty = 1, lwd = 2,
       bty = "n", cex = .9)

# 5. 計算結果。Web画面の表・CSVはこのresultを読み取る。
result <- list(
  settings = data.frame(setting = c("N", "B", "mu", "sigma", "distribution", "seed"),
                        value = c(N, B, mu, sigma, distribution, seed)),
  model = c("y_i = mu + sigma * z_i; observations are independent",
            paste("z distribution:", distribution), "E[z_i] = 0; Var(z_i) = 1"),
  metrics = data.frame(
    key = c("observed_mean", "population_mean", "mc_mean", "theory_sd", "mc_sd", "z_mean", "z_sd"),
    label = c("この標本の平均", "母平均", "B個の標本平均の平均", "標本平均の標準偏差・理論値",
              "標本平均の標準偏差・反復結果", "標準化した平均の平均", "標準化した平均の標準偏差"),
    value = c(y_bar, mu, mean(means), standard_error, sd(means),
              mean(standardized), sd(standardized))),
  data = data.frame(i = seq_len(N), y = y),
  repetitions = data.frame(b = seq_len(B), y_bar = means, standardized = standardized),
  plot_titles = c("1回の調査で得た個人の所得", "調査を繰り返して得た平均所得の分布", "標本平均の推定誤差を標準化した分布"),
  plot_notes = c(
    sprintf("1回の調査で得た%d人の所得を青い棒で集計している。青い曲線は母集団の所得分布，黒い縦の破線は母平均μ，橙の縦線は今回の標本平均。縦軸は密度で，棒の面積が各区間の割合を表す。", N),
    sprintf("1回%d人の調査を%d回繰り返し，各回の平均所得を青い棒で集計している。橙の曲線は%s，黒い縦の破線は母平均μ。縦軸は密度で，棒の面積が各区間の割合を表す。", N, B, if (distribution == "normal") "標本平均の理論上の正規分布" else "標本平均の分布の正規近似"),
    sprintf("各回の標本平均から母平均μを引き，標本平均の標準偏差σ/√Nで割った%d個の値の分布。橙の曲線は平均0・分散1の標準正規分布。縦軸は密度で，棒の面積が各区間の割合を表す。", B))
)
print(result$metrics[, c("label", "value")], row.names = FALSE)
invisible(result)

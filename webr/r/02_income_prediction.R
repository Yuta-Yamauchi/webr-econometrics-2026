# 条件付き期待値・線形射影 / Conditional expectation and linear projection
# 教育年数と年間所得を題材とする仮想データ。
# SETTINGS_BEGIN
N <- 240L
curvature <- 3          # 条件付き平均の二次項の係数
p <- 0.4                # 教育年数14・16年の人口比率の合計
sigma <- 35             # 所得の誤差の標準偏差（万円）
seed <- 202L
# SETTINGS_END

stopifnot(N >= 3, N == as.integer(N), all(is.finite(c(curvature, p, sigma))),
          p > 0, p < 1, sigma > 0)
set.seed(seed)
education <- c(9, 12, 14, 16)
probability <- c((1-p)/2, (1-p)/2, p/2, p/2)
conditional_mean <- function(s) 100 + 20 * s + curvature * (s - 12)^2
m <- conditional_mean(education)

# 1. 母集団の期待値を4つの教育年数に関する加重和で計算する。
# x_i = (1, s_i)は行ベクトル。Q = E[x_i' x_i]。
X_population <- cbind(1, education)
Q <- crossprod(X_population, probability * X_population)
beta_projection <- solve(Q, crossprod(X_population, probability * m))
linear_mean <- drop(X_population %*% beta_projection)
population_mean <- sum(probability * m)
conditional_projection_error <- m - linear_mean
mse <- c(constant = sigma^2 + sum(probability * (m - population_mean)^2),
         linear = sigma^2 + sum(probability * conditional_projection_error^2),
         conditional = sigma^2)

# 2. 一つの標本からOLSを計算する。
s <- sample(education, N, replace = TRUE, prob = probability)
epsilon <- rnorm(N, sd = sigma)
y <- conditional_mean(s) + epsilon
X <- cbind(1, s)
if (qr(X)$rank < 2) stop("教育年数が全員同じである。乱数シードまたは標本数を変更する。")
beta_ols <- solve(crossprod(X), crossprod(X, y))
residual <- drop(y - X %*% beta_ols)
orthogonality <- drop(crossprod(X_population, probability * conditional_projection_error))

blue <- "#005A85"; orange <- "#B45A20"; ink <- "#182632"; green <- "#267356"
par(family = getOption("econometrics.font", "sans"), mar = c(4.5, 4.8, 3, 1.2), mgp = c(2.9, .8, 0),
    col = ink, col.axis = ink, col.lab = ink, fg = ink, las = 1, bty = "l")
plot(jitter(s, amount = .12), y, pch = 16, col = adjustcolor(ink, .25),
     xlim = c(8.5, 16.5), ylim = range(y, m) + c(-.1, .25) * diff(range(y, m)),
     xaxt = "n", xlab = "教育年数（年）", ylab = "年間所得（万円）", main = "教育年数・所得の予測")
axis(1, at = education)
lines(education, m, col = blue, type = "b", pch = 16, lwd = 2.5)
abline(beta_projection, col = orange, lwd = 2.5)
abline(beta_ols, col = ink, lwd = 2, lty = 2)
abline(h = population_mean, col = green, lwd = 2, lty = 3)
legend("topleft", c("条件付き期待値", "母集団の線形射影", "標本のOLS", "母平均"),
       col = c(blue, orange, ink, green), lty = c(1, 1, 2, 3), lwd = 2, bty = "n", cex = .86)

barplot(rbind(rep(sigma^2, 3), pmax(mse - sigma^2, 0)),
        names.arg = c("母平均", "線形射影", "条件付き期待値"), col = c(blue, orange), border = NA,
        ylim = c(0, max(mse) * 1.35), ylab = "二乗予測誤差の期待値（万円²）",
        main = "母集団の二乗予測誤差")
legend("topright", c("所得の誤差の分散", "平均関数とのずれ"), fill = c(blue, orange), bty = "n", cex = .9)

lim <- max(1, abs(conditional_projection_error)) * 1.4
barplot(conditional_projection_error, names.arg = education, col = blue, border = NA,
        ylim = c(-lim, lim), xlab = "教育年数（年）", ylab = "条件付き平均 − 射影の予測値（万円）",
        main = "教育年数別の射影誤差の平均")
abline(h = 0, col = ink)

result <- list(
  settings = data.frame(setting = c("N", "curvature", "p", "sigma", "seed"), value = c(N, curvature, p, sigma, seed)),
  model = c("s in {9,12,14,16}; probabilities = ((1-p)/2,(1-p)/2,p/2,p/2)",
            "y = 100 + 20*s + curvature*(s-12)^2 + epsilon; epsilon ~ N(0,sigma^2), independent of s"),
  metrics = data.frame(
    key = c("population_mean", "population_intercept", "population_slope", "sample_intercept", "sample_slope",
            "mse_constant", "mse_linear", "mse_conditional", "error_mean", "error_s_moment", "sample_normal_equation"),
    label = c("母平均", "線形射影の定数項", "線形射影の教育年数係数", "OLSの定数項", "OLSの教育年数係数",
              "母平均予測の母集団MSE", "線形射影の母集団MSE", "条件付き期待値の母集団MSE",
              "射影誤差の期待値", "教育年数 × 射影誤差の期待値", "X′残差の最大絶対値"),
    value = c(population_mean, beta_projection, beta_ols, mse, orthogonality, max(abs(crossprod(X, residual))))),
  data = data.frame(i = seq_len(N), s = s, y = y, epsilon = epsilon, conditional_mean = conditional_mean(s),
                    projection = drop(X %*% beta_projection), ols_fitted = drop(X %*% beta_ols), residual = residual),
  groups = data.frame(s = education, probability = probability, conditional_mean = m,
                      projection = linear_mean, conditional_projection_error = conditional_projection_error),
  plot_titles = c("教育年数・所得", "三つの予測の二乗誤差", "条件付き平均・線形射影の差"),
  plot_notes = c("点の横位置には重なりを避けるための微小なずれを加えている。計算には元の教育年数を使う。",
                 "生成モデルから計算した期待値である。青はσ²，橙は平均関数と予測関数の差の二乗の期待値である。",
                 "各教育年数における条件付き期待値から，母集団の線形射影の値を引いている。"))
print(result$metrics[, c("label", "value")], row.names = FALSE)
invisible(result)

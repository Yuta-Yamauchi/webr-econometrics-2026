# 行列OLS・係数の精度 / Matrix OLS and precision
# 経験年数・勤続年数・年間所得の仮想データ。
# SETTINGS_BEGIN
N <- 80L
B <- 500L
rho <- 0.3              # 二つの説明変数の母相関
beta1 <- 8              # 経験年数の係数（万円／年）
beta2 <- 12             # 勤続年数の係数（万円／年）
sigma <- 60             # 所得の誤差の標準偏差（万円）
seed <- 305L
# SETTINGS_END

stopifnot(N > 3, N == as.integer(N), B >= 2, B == as.integer(B),
          all(is.finite(c(rho, beta1, beta2, sigma))), abs(rho) < 1, sigma > 0)
if (N * B > 5e6) stop("N × B は 5,000,000 以下に設定する。")
set.seed(seed)

# 1. Xを一度だけ生成する。x_i = (1, x_i1, x_i2)は行ベクトル。
v <- runif(N, -sqrt(3), sqrt(3)); w <- runif(N, -sqrt(3), sqrt(3))
x1 <- 20 + 6 * v
x2 <- 5 + 1.5 * (rho * v + sqrt(1 - rho^2) * w)
X <- cbind(1, x1, x2)
beta <- matrix(c(200, beta1, beta2), ncol = 1)
XtX_inverse <- solve(crossprod(X))
A <- XtX_inverse %*% t(X)
conditional_variance <- sigma^2 * XtX_inverse

# 2. 表示する一つの標本。係数の計算とlm()の結果を照合できる。
u <- rnorm(N, sd = sigma)
y <- drop(X %*% beta) + u
beta_hat <- A %*% y
residual <- drop(y - X %*% beta_hat)
lm_beta <- coef(lm(y ~ x1 + x2))

# 3. Xは固定し，所得の誤差uだけを作り直す。
repeated <- t(replicate(B, {
  yy <- drop(X %*% beta) + rnorm(N, sd = sigma)
  bb <- A %*% yy
  rss <- sum((yy - X %*% bb)^2)
  c(intercept = bb[1], beta1 = bb[2], beta2 = bb[3],
    variance_naive = rss / N, variance_corrected = rss / (N - 3))
}))

blue <- "#005A85"; orange <- "#B45A20"; ink <- "#182632"
par(family = getOption("econometrics.font", "sans"), mar = c(4.5, 4.8, 3, 1.2), mgp = c(2.9, .8, 0),
    col = ink, col.axis = ink, col.lab = ink, fg = ink, las = 1, bty = "l")
plot(x1, x2, pch = 16, col = adjustcolor(blue, .55),
     xlab = "経験年数（年）", ylab = "勤続年数（年）",
     main = sprintf("反復中に固定する%d人の説明変数", N))

par(mfrow = c(1, 2), mar = c(4.5, 4.3, 3, .8), cex = .85)
for (j in 1:2) {
  target <- beta[j + 1]; ss <- sqrt(conditional_variance[j + 1, j + 1])
  values <- repeated[, j + 1]; lim <- range(values, target + c(-4, 4) * ss)
  xx <- seq(lim[1], lim[2], length.out = 600); hh <- hist(values, breaks = "FD", plot = FALSE)
  plot(hh, freq = FALSE, col = "#D9E8EF", border = "white", xlim = lim,
       ylim = c(0, max(hh$density, dnorm(xx, target, ss)) * 1.3),
       main = c("経験年数の係数", "勤続年数の係数")[j], xlab = "係数（万円／年）", ylab = "密度")
  lines(xx, dnorm(xx, target, ss), col = orange, lwd = 2)
  abline(v = target, col = ink, lty = 2, lwd = 2)
  legend("topright", c("条件付き正規密度", "生成式の係数"), col = c(orange, ink),
         lty = c(1, 2), lwd = 2, bty = "n", cex = .8)
}

par(mfrow = c(1, 1), cex = 1, mar = c(5.5, 6, 3, 1.2), mgp = c(3.8, .8, 0))
breaks <- pretty(range(repeated[, 4:5], sigma^2), n = 30)
hn <- hist(repeated[, "variance_naive"], breaks = breaks, plot = FALSE)
hc <- hist(repeated[, "variance_corrected"], breaks = breaks, plot = FALSE)
plot(hn, freq = FALSE, col = adjustcolor(orange, .45), border = "white",
     ylim = c(0, max(hn$density, hc$density) * 1.3),
     main = "残差から計算する二つの分散推定値", xlab = "分散（万円²）", ylab = "密度")
plot(hc, freq = FALSE, col = adjustcolor(blue, .45), border = "white", add = TRUE)
abline(v = sigma^2, col = ink, lty = 2, lwd = 2)
legend("topright", c("RSS / N", "RSS / (N − 3)", "誤差の分散 σ²"),
       col = c(orange, blue, ink), lwd = c(7, 7, 2), lty = c(1, 1, 2), bty = "n", cex = .9)

result <- list(
  settings = data.frame(setting = c("N", "B", "rho", "beta1", "beta2", "sigma", "seed"),
                        value = c(N, B, rho, beta1, beta2, sigma, seed)),
  model = c("v,w independent U(-sqrt(3),sqrt(3)); x1=20+6*v; x2=5+1.5*(rho*v+sqrt(1-rho^2)*w)",
            "X is fixed across replications; y=X*beta+u; u ~ N(0,sigma^2 I); beta=(200,beta1,beta2)'"),
  metrics = data.frame(
    key = c("estimate1", "estimate2", "sample_correlation", "theory_sd1", "mc_sd1", "theory_sd2", "mc_sd2",
            "true_variance", "variance_naive_target", "variance_naive", "variance_corrected", "matrix_lm_gap", "normal_equation"),
    label = c("今回の経験年数係数", "今回の勤続年数係数", "今回の説明変数の標本相関", "経験年数係数の標準偏差・理論値", "経験年数係数の標準偏差・反復結果",
              "勤続年数係数の標準偏差・理論値", "勤続年数係数の標準偏差・反復結果", "誤差の分散 σ²",
              "RSS/Nの期待値", "RSS/Nの反復平均", "RSS/(N−3)の反復平均", "行列計算・lmの係数の最大差", "X′残差の最大絶対値"),
    value = c(beta_hat[2:3], cor(x1, x2), sqrt(conditional_variance[2, 2]), sd(repeated[, 2]),
              sqrt(conditional_variance[3, 3]), sd(repeated[, 3]), sigma^2,
              (N - 3) / N * sigma^2, mean(repeated[, 4]), mean(repeated[, 5]),
              max(abs(beta_hat - lm_beta)), max(abs(crossprod(X, residual))))),
  data = data.frame(i = seq_len(N), x1 = x1, x2 = x2, u = u, y = y, fitted = drop(X %*% beta_hat), residual = residual),
  repetitions = data.frame(b = seq_len(B), repeated),
  plot_titles = c("説明変数の組合せ", "Xを固定した係数の標本分布", "残差分散の標本分布"),
  plot_notes = c("同じN人の説明変数をすべての反復で使う。",
                 "棒は反復結果，橙線はこのXの下での正規密度，破線は生成式の係数である。",
                 "RSSは残差平方和である。推定する係数は定数項を含め3個である。"))
print(result$metrics[, c("label", "value")], row.names = FALSE)
invisible(result)

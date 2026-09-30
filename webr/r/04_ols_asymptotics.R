# OLSの漸近分布・デルタ法 / OLS asymptotics and delta method
# 経験年数・勤続年数・年間所得の仮想データ。
# SETTINGS_BEGIN
N <- 100L               # N人と4N人の標本を比較する
B <- 500L
rho <- 0.3
beta1 <- 8
beta2 <- 12
sigma <- 40
error_dist <- "exponential"  # "normal" または "exponential"
seed <- 406L
# SETTINGS_END

stopifnot(N > 3, N == as.integer(N), B >= 2, B == as.integer(B),
          all(is.finite(c(rho, beta1, beta2, sigma))), abs(rho) < 1,
          beta2 != 0, sigma > 0, error_dist %in% c("normal", "exponential"))
if (5 * N * B > 5e6) stop("5 × N × B は 5,000,000 以下に設定する。")
set.seed(seed)
beta <- matrix(c(200, beta1, beta2), ncol = 1)

# 1. 母集団の二次モーメントQと漸近分散V
mean_x <- c(1, 20, 5)
Q <- tcrossprod(mean_x)
Q[2:3, 2:3] <- Q[2:3, 2:3] + matrix(c(36, 9*rho, 9*rho, 2.25), 2, 2)
Q_inverse <- solve(Q)
V <- sigma^2 * Q_inverse
h0 <- beta1 / beta2
H <- matrix(c(0, 1/beta2, -beta1/beta2^2), nrow = 1)
delta_variance <- drop(H %*% V %*% t(H))

# 2. 反復ごとにXとuの両方を新しく生成する。
draw_sample <- function(n) {
  v <- runif(n, -sqrt(3), sqrt(3)); w <- runif(n, -sqrt(3), sqrt(3))
  x1 <- 20 + 6*v
  x2 <- 5 + 1.5*(rho*v + sqrt(1-rho^2)*w)
  X <- cbind(1, x1, x2)
  e <- if (error_dist == "normal") rnorm(n) else rexp(n) - 1
  u <- sigma*e
  y <- drop(X %*% beta) + u
  list(X = X, u = u, y = y)
}
estimate <- function(dd) {
  n <- nrow(dd$X)
  bhat <- solve(crossprod(dd$X), crossprod(dd$X, dd$y))
  # (X'X/N)^(-1)をQ^(-1)へ置き換えた一次近似
  influence <- Q_inverse %*% crossprod(dd$X, dd$u) / n
  # h(bhat)の一次近似 h(beta) + H*(bhat-beta)
  h_linear <- h0 + drop(H %*% (bhat - beta))
  c(intercept = bhat[1], beta1 = bhat[2], beta2 = bhat[3],
    standardized = sqrt(n) * (bhat[2] - beta1) / sqrt(V[2, 2]),
    exact_scaled = sqrt(n) * (bhat[2] - beta1),
    influence_scaled = sqrt(n) * influence[2],
    ratio = bhat[2] / bhat[3], ratio_linear = h_linear)
}
sizes <- c(N, 4L*N)
dat <- draw_sample(N)
one <- estimate(dat)
repetitions <- do.call(rbind, lapply(sizes, function(n) {
  values <- t(replicate(B, estimate(draw_sample(n))))
  data.frame(N = n, b = seq_len(B), values)
}))
small <- repetitions[repetitions$N == N, ]
large <- repetitions[repetitions$N == 4*N, ]

blue <- "#005A85"; orange <- "#B45A20"; ink <- "#182632"
par(family = getOption("econometrics.font", "sans"), mar = c(4.5, 4.8, 3, 1.2), mgp = c(2.9, .8, 0),
    col = ink, col.axis = ink, col.lab = ink, fg = ink, las = 1, bty = "l")
breaks <- pretty(range(repetitions$beta1, beta1), n = 35)
hs <- hist(small$beta1, breaks = breaks, plot = FALSE)
hl <- hist(large$beta1, breaks = breaks, plot = FALSE)
plot(hs, freq = FALSE, col = adjustcolor(orange, .45), border = "white",
     ylim = c(0, max(hs$density, hl$density) * 1.3),
     main = "経験年数のOLS係数", xlab = "係数（万円／年）", ylab = "密度")
plot(hl, freq = FALSE, col = adjustcolor(blue, .45), border = "white", add = TRUE)
abline(v = beta1, col = ink, lty = 2, lwd = 2)
legend("topright", c(paste0("N = ", N), paste0("N = ", 4*N), "生成式の係数"),
       col = c(orange, blue, ink), lty = c(1, 1, 2), lwd = c(7, 7, 2), bty = "n", cex = .9)

par(mfrow = c(1, 2), mar = c(4.5, 4.3, 3, .8), cex = .85)
z_limits <- range(repetitions$standardized, -4, 4)
for (n in sizes) {
  zz <- repetitions$standardized[repetitions$N == n]
  xx <- seq(z_limits[1], z_limits[2], length.out = 600)
  hh <- hist(zz, breaks = "FD", plot = FALSE)
  plot(hh, freq = FALSE, col = "#D9E8EF", border = "white", xlim = z_limits,
       ylim = c(0, max(hh$density, dnorm(xx)) * 1.2), main = paste0("N = ", n),
       xlab = "中心化・標準化したOLS係数", ylab = "密度")
  lines(xx, dnorm(xx), col = orange, lwd = 2)
  legend("topright", "標準正規密度", col = orange, lty = 1, lwd = 2, bty = "n", cex = .8)
}

for (n in sizes) {
  dd <- repetitions[repetitions$N == n, ]
  lim <- range(dd$influence_scaled, dd$exact_scaled)
  plot(dd$influence_scaled, dd$exact_scaled, pch = 16, col = adjustcolor(blue, .4),
       xlim = lim, ylim = lim, main = paste0("N = ", n),
       xlab = "Qを使った近似（√N倍）", ylab = "OLSの推定誤差（√N倍）")
  abline(0, 1, col = ink, lty = 2, lwd = 2)
}

for (n in sizes) {
  dd <- repetitions[repetitions$N == n, ]
  lim <- range(dd$ratio_linear - h0, dd$ratio - h0)
  plot(dd$ratio_linear - h0, dd$ratio - h0, pch = 16, col = adjustcolor(blue, .4),
       xlim = lim, ylim = lim, main = paste0("N = ", n),
       xlab = "一次近似 H(β̂ − β)", ylab = "係数比の推定誤差")
  abline(0, 1, col = ink, lty = 2, lwd = 2)
}
par(mfrow = c(1, 1), cex = 1)

result <- list(
  settings = data.frame(setting = c("N", "N_large", "B", "rho", "beta1", "beta2", "sigma", "error_dist", "seed"),
                        value = c(N, 4*N, B, rho, beta1, beta2, sigma, error_dist, seed)),
  model = c("x1=20+6*v; x2=5+1.5*(rho*v+sqrt(1-rho^2)*w); independent standardized uniforms v,w",
            "y=X*beta+u; X and u are redrawn for each replication; E[u|X]=0; Var(u|X)=sigma^2 I",
            "Q=E[x_i' x_i]; V=sigma^2 Q^(-1); h(beta)=beta1/beta2; H=(0,1/beta2,-beta1/beta2^2)"),
  metrics = data.frame(
    key = c("estimate1", "ratio_target", "ratio_observed", "theory_sd_small", "sd_small", "theory_sd_large", "sd_large",
            "delta_sd_small", "delta_sd_large", "influence_rmse_small", "influence_rmse_large", "delta_median_error_small", "delta_median_error_large"),
    label = c("今回の経験年数係数", "生成式の係数比 β₁/β₂", "今回のOLS係数比", "N人の係数の漸近標準偏差", "N人の係数の反復標準偏差",
              "4N人の係数の漸近標準偏差", "4N人の係数の反復標準偏差", "N人の係数比のデルタ法標準偏差", "4N人の係数比のデルタ法標準偏差",
              "N人の√N倍のOLS・一次近似のRMSE", "4N人の√N倍のOLS・一次近似のRMSE",
              "N人の係数比・一次近似の絶対差の中央値", "4N人の係数比・一次近似の絶対差の中央値"),
    value = c(one["beta1"], h0, one["ratio"], sqrt(V[2, 2]/N), sd(small$beta1), sqrt(V[2, 2]/(4*N)), sd(large$beta1),
              sqrt(delta_variance/N), sqrt(delta_variance/(4*N)),
              sqrt(mean((small$exact_scaled - small$influence_scaled)^2)), sqrt(mean((large$exact_scaled - large$influence_scaled)^2)),
              median(abs(small$ratio - small$ratio_linear)), median(abs(large$ratio - large$ratio_linear)))),
  data = data.frame(i = seq_len(N), x1 = dat$X[, 2], x2 = dat$X[, 3], y = dat$y, u = dat$u),
  repetitions = repetitions,
  plot_titles = c("標本数・係数の分布", "中心化・標準化した係数", "OLSの一次近似", "係数比の一次近似"),
  plot_notes = c("各標本で説明変数と所得の誤差を新しく生成する。",
                 "√N(β̂₁ − β₁)を，V = σ²Q⁻¹の経験年数係数に対応する対角要素の平方根で割っている。",
                 "横軸はQ⁻¹X′u/N，縦軸はβ̂ − βの経験年数成分をそれぞれ√N倍した値である。破線は両者が等しい位置である。",
                 "横軸は係数比の一次近似，縦軸はβ̂₁/β̂₂ − β₁/β₂である。H = (0, 1/β₂, −β₁/β₂²)。破線は両者が等しい位置である。"))
print(result$metrics[, c("label", "value")], row.names = FALSE)
invisible(result)

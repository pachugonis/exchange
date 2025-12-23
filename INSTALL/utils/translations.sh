#!/bin/bash

#############################################################################
# Translation System for Installation Scripts
# Supports English (en) and Russian (ru)
#############################################################################

# Default language
LANG_CODE="${LANG_CODE:-${INSTALL_LANG:-en}}"

# Translation function
t() {
    local key="$1"
    local lang="${LANG_CODE}"
    
    # Get translation based on key and language
    case "${lang}_${key}" in
        # Banner and Welcome
        en_banner_title) echo "ExchangeKit - Automated Installer" ;;
        ru_banner_title) echo "ExchangeKit - Автоматический установщик" ;;
        
        en_banner_version) echo "Version" ;;
        ru_banner_version) echo "Версия" ;;
        
        en_wizard_title) echo "EXCHANGEKIT - INSTALLATION WIZARD" ;;
        ru_wizard_title) echo "EXCHANGEKIT - МАСТЕР УСТАНОВКИ" ;;
        
        en_wizard_intro) echo "This wizard will guide you through the installation process." ;;
        ru_wizard_intro) echo "Этот мастер проведет вас через процесс установки." ;;
        
        en_wizard_requirements) echo "Please have the following information ready:" ;;
        ru_wizard_requirements) echo "Пожалуйста, подготовьте следующую информацию:" ;;
        
        en_wizard_domain) echo "Your domain name (DNS must point to this server)" ;;
        ru_wizard_domain) echo "Ваше доменное имя (DNS должен указывать на этот сервер)" ;;
        
        en_wizard_admin_email) echo "Administrator email address" ;;
        ru_wizard_admin_email) echo "Email адрес администратора" ;;
        
        en_wizard_admin_password) echo "Strong administrator password" ;;
        ru_wizard_admin_password) echo "Надежный пароль администратора" ;;
        
        en_wizard_license) echo "Valid license key (format: LIC-XXXX-XXXX-XXXX-XXXX)" ;;
        ru_wizard_license) echo "Действительный лицензионный ключ (формат: LIC-XXXX-XXXX-XXXX-XXXX)" ;;
        
        en_press_enter) echo "Press Enter to continue..." ;;
        ru_press_enter) echo "Нажмите Enter для продолжения..." ;;
        
        # Phases
        en_phase1) echo "Phase 1: System Prerequisites Check" ;;
        ru_phase1) echo "Фаза 1: Проверка системных требований" ;;
        
        en_phase2) echo "Phase 2: Configuration Wizard" ;;
        ru_phase2) echo "Фаза 2: Мастер настройки" ;;
        
        en_phase3) echo "Phase 3: System Preparation" ;;
        ru_phase3) echo "Фаза 3: Подготовка системы" ;;
        
        en_phase4) echo "Phase 4: Application Deployment" ;;
        ru_phase4) echo "Фаза 4: Развертывание приложения" ;;
        
        en_phase5) echo "Phase 5: Database Initialization" ;;
        ru_phase5) echo "Фаза 5: Инициализация базы данных" ;;
        
        en_phase6) echo "Phase 6: License Activation" ;;
        ru_phase6) echo "Фаза 6: Активация лицензии" ;;
        
        en_phase7) echo "Phase 7: Administrator Account Setup" ;;
        ru_phase7) echo "Фаза 7: Настройка учетной записи администратора" ;;
        
        en_phase8) echo "Phase 8: Final System Check" ;;
        ru_phase8) echo "Фаза 8: Финальная проверка системы" ;;
        
        # Configuration prompts
        en_enter_domain) echo "Enter your domain name:" ;;
        ru_enter_domain) echo "Введите ваше доменное имя:" ;;
        
        en_enter_admin_email) echo "Enter administrator email:" ;;
        ru_enter_admin_email) echo "Введите email администратора:" ;;
        
        en_enter_admin_password) echo "Enter administrator password:" ;;
        ru_enter_admin_password) echo "Введите пароль администратора:" ;;
        
        en_confirm_password) echo "Confirm password:" ;;
        ru_confirm_password) echo "Подтвердите пароль:" ;;
        
        en_enter_license) echo "Enter license key:" ;;
        ru_enter_license) echo "Введите лицензионный ключ:" ;;
        
        en_enter_db_password) echo "Enter database password:" ;;
        ru_enter_db_password) echo "Введите пароль базы данных:" ;;
        
        # Validation messages
        en_invalid_domain) echo "Invalid domain format" ;;
        ru_invalid_domain) echo "Неверный формат домена" ;;
        
        en_invalid_email) echo "Invalid email format" ;;
        ru_invalid_email) echo "Неверный формат email" ;;
        
        en_password_mismatch) echo "Passwords do not match" ;;
        ru_password_mismatch) echo "Пароли не совпадают" ;;
        
        en_password_too_short) echo "Password must be at least 8 characters" ;;
        ru_password_too_short) echo "Пароль должен содержать минимум 8 символов" ;;
        
        en_invalid_license) echo "Invalid license key format" ;;
        ru_invalid_license) echo "Неверный формат лицензионного ключа" ;;
        
        # Configuration sections
        en_domain_config_title) echo "Domain Configuration" ;;
        ru_domain_config_title) echo "Настройка домена" ;;
        
        en_admin_email_title) echo "Administrator Email" ;;
        ru_admin_email_title) echo "Email администратора" ;;
        
        en_email_usage_info) echo "This email will be used for:" ;;
        ru_email_usage_info) echo "Этот email будет использоваться для:" ;;
        
        en_email_usage_ssl) echo "SSL certificate notifications" ;;
        ru_email_usage_ssl) echo "Уведомлений SSL-сертификата" ;;
        
        en_email_usage_login) echo "Administrator account login" ;;
        ru_email_usage_login) echo "Входа в учетную запись администратора" ;;
        
        en_email_usage_notifications) echo "System notifications" ;;
        ru_email_usage_notifications) echo "Системных уведомлений" ;;
        
        en_admin_password_title) echo "Administrator Password" ;;
        ru_admin_password_title) echo "Пароль администратора" ;;
        
        en_password_requirements) echo "Password requirements:" ;;
        ru_password_requirements) echo "Требования к паролю:" ;;
        
        en_password_req_length) echo "Minimum 12 characters" ;;
        ru_password_req_length) echo "Минимум 12 символов" ;;
        
        en_password_req_uppercase) echo "At least one uppercase letter" ;;
        ru_password_req_uppercase) echo "Минимум одна заглавная буква" ;;
        
        en_password_req_lowercase) echo "At least one lowercase letter" ;;
        ru_password_req_lowercase) echo "Минимум одна строчная буква" ;;
        
        en_password_req_number) echo "At least one number" ;;
        ru_password_req_number) echo "Минимум одна цифра" ;;
        
        en_password_req_special) echo "At least one special character" ;;
        ru_password_req_special) echo "Минимум один специальный символ" ;;
        
        en_license_key_title) echo "License Key" ;;
        ru_license_key_title) echo "Лицензионный ключ" ;;
        
        en_license_key_info) echo "Enter your product license key." ;;
        ru_license_key_info) echo "Введите ваш лицензионный ключ продукта." ;;
        
        en_license_key_format) echo "Format: LIC-XXXX-XXXX-XXXX-XXXX" ;;
        ru_license_key_format) echo "Формат: LIC-XXXX-XXXX-XXXX-XXXX" ;;
        
        en_database_config_title) echo "Database Configuration" ;;
        ru_database_config_title) echo "Настройка базы данных" ;;
        
        en_database_info) echo "A PostgreSQL database will be created for the application." ;;
        ru_database_info) echo "Для приложения будет создана база данных PostgreSQL." ;;
        
        en_auto_generate_db_password) echo "Auto-generate secure database password?" ;;
        ru_auto_generate_db_password) echo "Автоматически сгенерировать безопасный пароль базы данных?" ;;
        
        en_enter_db_password_prompt) echo "Enter database password (min 16 characters):" ;;
        ru_enter_db_password_prompt) echo "Введите пароль базы данных (минимум 16 символов):" ;;
        
        en_db_password_set) echo "Database password set" ;;
        ru_db_password_set) echo "Пароль базы данных установлен" ;;
        
        en_db_password_min_length) echo "Password must be at least 16 characters." ;;
        ru_db_password_min_length) echo "Пароль должен содержать минимум 16 символов." ;;
        
        en_db_password_generated) echo "Database password auto-generated" ;;
        ru_db_password_generated) echo "Пароль базы данных сгенерирован автоматически" ;;
        
        en_port_config_title) echo "Port Configuration" ;;
        ru_port_config_title) echo "Настройка портов" ;;
        
        en_default_ports_info) echo "Default ports: HTTP (80), HTTPS (443)" ;;
        ru_default_ports_info) echo "Порты по умолчанию: HTTP (80), HTTPS (443)" ;;
        
        en_use_default_ports) echo "Use default ports?" ;;
        ru_use_default_ports) echo "Использовать порты по умолчанию?" ;;
        
        en_http_port_prompt) echo "HTTP port" ;;
        ru_http_port_prompt) echo "HTTP порт" ;;
        
        en_https_port_prompt) echo "HTTPS port" ;;
        ru_https_port_prompt) echo "HTTPS порт" ;;
        
        en_using_custom_ports) echo "Using ports:" ;;
        ru_using_custom_ports) echo "Используемые порты:" ;;
        
        en_using_default_ports) echo "Using default ports: HTTP=80, HTTPS=443" ;;
        ru_using_default_ports) echo "Используются порты по умолчанию: HTTP=80, HTTPS=443" ;;
        
        en_summary_domain) echo "Domain" ;;
        ru_summary_domain) echo "Домен" ;;
        
        en_summary_admin_email) echo "Admin Email" ;;
        ru_summary_admin_email) echo "Email администратора" ;;
        
        en_summary_admin_password) echo "Admin Password" ;;
        ru_summary_admin_password) echo "Пароль администратора" ;;
        
        en_summary_license_key) echo "License Key" ;;
        ru_summary_license_key) echo "Лицензионный ключ" ;;
        
        en_summary_db_password) echo "Database Password" ;;
        ru_summary_db_password) echo "Пароль базы данных" ;;
        
        en_summary_http_port) echo "HTTP Port" ;;
        ru_summary_http_port) echo "HTTP порт" ;;
        
        en_summary_https_port) echo "HTTPS Port" ;;
        ru_summary_https_port) echo "HTTPS порт" ;;
        
        en_config_saved) echo "Configuration saved" ;;
        ru_config_saved) echo "Конфигурация сохранена" ;;
        
        en_installation_cancelled) echo "Installation cancelled by user" ;;
        ru_installation_cancelled) echo "Установка отменена пользователем" ;;
        
        en_config_complete) echo "Configuration complete!" ;;
        ru_config_complete) echo "Настройка завершена!" ;;
        
        # Installation completion messages
        en_installation_success_title) echo "INSTALLATION COMPLETED SUCCESSFULLY!" ;;
        ru_installation_success_title) echo "УСТАНОВКА УСПЕШНО ЗАВЕРШЕНА!" ;;
        
        en_application_url) echo "Application URL" ;;
        ru_application_url) echo "URL приложения" ;;
        
        en_admin_panel) echo "Admin Panel" ;;
        ru_admin_panel) echo "Панель администратора" ;;
        
        en_admin_email) echo "Admin Email" ;;
        ru_admin_email) echo "Email администратора" ;;
        
        en_admin_password) echo "Admin Password" ;;
        ru_admin_password) echo "Пароль администратора" ;;
        
        en_security_notes) echo "IMPORTANT SECURITY NOTES" ;;
        ru_security_notes) echo "ВАЖНЫЕ ЗАМЕЧАНИЯ ПО БЕЗОПАСНОСТИ" ;;
        
        en_security_save_credentials) echo "Save your credentials in a secure location" ;;
        ru_security_save_credentials) echo "Сохраните учетные данные в безопасном месте" ;;
        
        en_security_change_password) echo "Change your admin password after first login" ;;
        ru_security_change_password) echo "Измените пароль администратора после первого входа" ;;
        
        en_security_enable_2fa) echo "Enable 2FA in the admin panel" ;;
        ru_security_enable_2fa) echo "Включите двухфакторную аутентификацию в панели администратора" ;;
        
        en_credentials_saved_to) echo "Your credentials are saved in" ;;
        ru_credentials_saved_to) echo "Ваши учетные данные сохранены в" ;;
        
        en_site_running_http) echo "Site is running on HTTP - enable HTTPS for security" ;;
        ru_site_running_http) echo "Сайт работает по HTTP - включите HTTPS для безопасности" ;;
        
        en_next_steps) echo "Next Steps" ;;
        ru_next_steps) echo "Следующие шаги" ;;
        
        en_step_visit_admin) echo "Visit http://${DOMAIN}/admin/login to access admin panel" ;;
        ru_step_visit_admin) echo "Перейдите на http://${DOMAIN}/admin/login для доступа к панели администратора" ;;
        
        en_step_use_email) echo "Use email" ;;
        ru_step_use_email) echo "Используйте email" ;;
        
        en_step_use_password) echo "Use password" ;;
        ru_step_use_password) echo "Используйте пароль" ;;
        
        en_step_clear_cache) echo "If login fails, clear browser cache and try again" ;;
        ru_step_clear_cache) echo "Если вход не удался, очистите кэш браузера и попробуйте снова" ;;
        
        en_step_complete_profile) echo "Complete your profile setup" ;;
        ru_step_complete_profile) echo "Завершите настройку профиля" ;;
        
        en_step_configure_rates) echo "Configure exchange rates and currencies" ;;
        ru_step_configure_rates) echo "Настройте курсы обмена и валюты" ;;
        
        en_step_setup_ssl) echo "Setup SSL certificate (recommended)" ;;
        ru_step_setup_ssl) echo "Установите SSL сертификат (рекомендуется)" ;;
        
        en_useful_commands) echo "Useful Commands" ;;
        ru_useful_commands) echo "Полезные команды" ;;
        
        en_cmd_view_logs) echo "View logs" ;;
        ru_cmd_view_logs) echo "Просмотр логов" ;;
        
        en_cmd_restart_services) echo "Restart services" ;;
        ru_cmd_restart_services) echo "Перезапуск сервисов" ;;
        
        en_cmd_stop_services) echo "Stop services" ;;
        ru_cmd_stop_services) echo "Остановка сервисов" ;;
        
        en_cmd_start_services) echo "Start services" ;;
        ru_cmd_start_services) echo "Запуск сервисов" ;;
        
        en_cmd_check_status) echo "Check status" ;;
        ru_cmd_check_status) echo "Проверка статуса" ;;
        
        en_support) echo "Support" ;;
        ru_support) echo "Поддержка" ;;
        
        en_documentation) echo "Documentation" ;;
        ru_documentation) echo "Документация" ;;
        
        en_support_email) echo "Support Email" ;;
        ru_support_email) echo "Email поддержки" ;;
        
        en_license_issues) echo "License Issues" ;;
        ru_license_issues) echo "Вопросы лицензирования" ;;
        
        # SSL Setup messages
        en_ssl_optional_title) echo "Optional: SSL Certificate Setup" ;;
        ru_ssl_optional_title) echo "Опционально: Установка SSL сертификата" ;;
        
        en_ssl_site_running_http) echo "Your site is currently running on HTTP (port 80)." ;;
        ru_ssl_site_running_http) echo "Ваш сайт сейчас работает по HTTP (порт 80)." ;;
        
        en_ssl_would_like_setup) echo "Would you like to set up HTTPS with a free SSL certificate from Let's Encrypt?" ;;
        ru_ssl_would_like_setup) echo "Хотите настроить HTTPS с бесплатным SSL сертификатом от Let's Encrypt?" ;;
        
        en_ssl_requirements) echo "Requirements" ;;
        ru_ssl_requirements) echo "Требования" ;;
        
        en_ssl_domain_must_point) echo "Domain %s must point to this server's IP" ;;
        ru_ssl_domain_must_point) echo "Домен %s должен указывать на IP этого сервера" ;;
        
        en_ssl_port_accessible) echo "Port 80 must be accessible from the internet" ;;
        ru_ssl_port_accessible) echo "Порт 80 должен быть доступен из интернета" ;;
        
        en_ssl_setup_now) echo "Setup SSL now? (y/n)" ;;
        ru_ssl_setup_now) echo "Установить SSL сейчас? (y/n)" ;;
        
        en_ssl_phase_9) echo "Phase 9: SSL Certificate Configuration" ;;
        ru_ssl_phase_9) echo "Фаза 9: Настройка SSL сертификата" ;;
        
        en_ssl_setup_complete) echo "SSL Setup Complete!" ;;
        ru_ssl_setup_complete) echo "Настройка SSL завершена!" ;;
        
        en_ssl_site_available_at) echo "Your site is now available at" ;;
        ru_ssl_site_available_at) echo "Ваш сайт теперь доступен по адресу" ;;
        
        en_ssl_setup_failed) echo "SSL setup was skipped or failed." ;;
        ru_ssl_setup_failed) echo "Настройка SSL пропущена или не удалась." ;;
        
        en_ssl_run_later) echo "You can run it later with" ;;
        ru_ssl_run_later) echo "Вы можете запустить позже командой" ;;
        
        en_ssl_setup_skipped) echo "SSL setup skipped." ;;
        ru_ssl_setup_skipped) echo "Настройка SSL пропущена." ;;
        
        en_ssl_enable_later) echo "You can enable HTTPS later by running" ;;
        ru_ssl_enable_later) echo "Вы можете включить HTTPS позже, выполнив" ;;
        
        # Success messages
        en_installation_complete) echo "Installation completed successfully!" ;;
        ru_installation_complete) echo "Установка успешно завершена!" ;;
        
        en_deployment_ready) echo "Your ExchangeKit platform is ready!" ;;
        ru_deployment_ready) echo "Ваша платформа ExchangeKit готова к работе!" ;;
        
        # Error messages
        en_must_run_as_root) echo "This script must be run as root. Please use: sudo bash install.sh" ;;
        ru_must_run_as_root) echo "Этот скрипт должен запускаться от имени root. Используйте: sudo bash install.sh" ;;
        
        en_prerequisites_failed) echo "Prerequisites check failed" ;;
        ru_prerequisites_failed) echo "Проверка требований не пройдена" ;;
        
        en_configuration_failed) echo "Configuration failed" ;;
        ru_configuration_failed) echo "Настройка не удалась" ;;
        
        en_docker_setup_failed) echo "Docker setup failed" ;;
        ru_docker_setup_failed) echo "Установка Docker не удалась" ;;
        
        en_database_setup_failed) echo "Database setup failed" ;;
        ru_database_setup_failed) echo "Настройка базы данных не удалась" ;;
        
        en_admin_setup_failed) echo "Admin setup failed" ;;
        ru_admin_setup_failed) echo "Настройка администратора не удалась" ;;
        
        # Info messages
        en_updating_packages) echo "Updating package repositories..." ;;
        ru_updating_packages) echo "Обновление репозиториев пакетов..." ;;
        
        en_starting_installation) echo "Starting ExchangeKit Installation" ;;
        ru_starting_installation) echo "Начало установки ExchangeKit" ;;
        
        en_configuration_summary) echo "Configuration Summary" ;;
        ru_configuration_summary) echo "Сводка конфигурации" ;;
        
        en_confirm_installation) echo "Do you want to proceed with installation? (yes/no):" ;;
        ru_confirm_installation) echo "Продолжить установку? (yes/no):" ;;
        
        # Access information
        en_access_info) echo "Access Information" ;;
        ru_access_info) echo "Информация для доступа" ;;
        
        en_admin_panel) echo "Admin Panel" ;;
        ru_admin_panel) echo "Панель администратора" ;;
        
        en_admin_credentials) echo "Administrator Credentials" ;;
        ru_admin_credentials) echo "Учетные данные администратора" ;;
        
        en_important_notes) echo "Important Notes" ;;
        ru_important_notes) echo "Важные заметки" ;;
        
        en_ssl_note) echo "To enable HTTPS, run: cd /root/INSTALL && bash enable-ssl.sh" ;;
        ru_ssl_note) echo "Для включения HTTPS выполните: cd /root/INSTALL && bash enable-ssl.sh" ;;
        
        en_credentials_saved) echo "Credentials saved to" ;;
        ru_credentials_saved) echo "Учетные данные сохранены в" ;;
        
        # Support
        en_support) echo "Support" ;;
        ru_support) echo "Поддержка" ;;
        
        en_support_email) echo "Support Email" ;;
        ru_support_email) echo "Email поддержки" ;;
        
        en_license_issues) echo "License Issues" ;;
        ru_license_issues) echo "Вопросы лицензирования" ;;
        
        # Default
        *) echo "$key" ;;
    esac
}

# Language selection function
select_language() {
    clear
    echo ""
    echo "═════════════════════════════════════════════════════════"
    echo ""
    echo "  Select installation language / Выберите язык установки"
    echo ""
    echo "═════════════════════════════════════════════════════════"
    echo ""
    echo "  1) English"
    echo "  2) Русский"
    echo ""
    echo -n "Enter your choice (1-2): "
    read -r lang_choice
    
    case "$lang_choice" in
        1)
            LANG_CODE="en"
            ;;
        2)
            LANG_CODE="ru"
            ;;
        *)
            echo "Invalid choice, using English by default"
            LANG_CODE="en"
            ;;
    esac
    
    export LANG_CODE
    echo ""
}
